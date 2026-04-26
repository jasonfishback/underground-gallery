// app/api/photos/route.ts
//
// POST /api/photos
//
// Receives a multipart/form-data upload:
//   - file:        the raw image (already cropped client-side)
//   - subjectType: 'user' | 'vehicle'
//   - subjectId:   the ID of the user or vehicle this photo belongs to
//   - shape:       'square' | 'wide'  (drives server-side fit)
//   - isPrimary:   '1' or '0'  (vehicle photos can be the hero; profile photos always replace)
//
// Returns:
//   { id, urlFull, urlThumb, width, height }
//
// Why a route handler instead of a server action: server actions in Next.js
// don't support raw multipart streams cleanly, and we want to handle large
// files without bloating client bundles.

import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, vehicles, photos } from "@/lib/db/schema";
import {
  processUploadedImage,
  MAX_UPLOAD_BYTES,
} from "@/lib/storage/image-processor";
import { r2Upload, r2Delete, r2KeyFromUrl } from "@/lib/storage/r2";

export const runtime = "nodejs"; // sharp needs node, not edge
export const maxDuration = 30;   // Vercel hard cap; sharp + R2 round-trip should be <5s

// nanoid alphabet — URL-safe, no ambiguous chars
const newPhotoId = customAlphabet(
  "0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz",
  12,
);

export async function POST(req: NextRequest) {
  // ── auth ──────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.status !== "active") {
    return NextResponse.json({ error: "not_approved" }, { status: 403 });
  }
  const userId = session.user.id;

  // ── parse multipart ──────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_form_data" }, { status: 400 });
  }

  const file = formData.get("file");
  const subjectType = formData.get("subjectType")?.toString();
  const subjectId = formData.get("subjectId")?.toString();
  const shape = (formData.get("shape")?.toString() ?? "free") as
    | "square"
    | "wide"
    | "free";
  const isPrimary = formData.get("isPrimary") === "1";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }
  if (!subjectType || !subjectId) {
    return NextResponse.json({ error: "missing_subject" }, { status: 400 });
  }
  if (subjectType !== "user" && subjectType !== "vehicle") {
    return NextResponse.json({ error: "invalid_subject_type" }, { status: 400 });
  }

  // ── authorization: caller must own the subject ───────────────────
  if (subjectType === "user") {
    if (subjectId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } else {
    // subjectType === 'vehicle'
    const veh = await db
      .select({ userId: vehicles.userId })
      .from(vehicles)
      .where(eq(vehicles.id, subjectId))
      .limit(1);
    if (veh.length === 0) {
      return NextResponse.json({ error: "vehicle_not_found" }, { status: 404 });
    }
    if (veh[0].userId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  // ── process image ────────────────────────────────────────────────
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let processed;
  try {
    processed = await processUploadedImage(inputBuffer, shape);
  } catch (err) {
    console.error("[/api/photos] image processing failed", err);
    return NextResponse.json({ error: "image_processing_failed" }, { status: 422 });
  }

  // ── upload to R2 ─────────────────────────────────────────────────
  const photoId = newPhotoId();
  const fullKey = `${photoId}/full.webp`;
  const thumbKey = `${photoId}/thumb.webp`;

  let urlFull: string;
  let urlThumb: string;
  try {
    [urlFull, urlThumb] = await Promise.all([
      r2Upload({ key: fullKey, body: processed.full, contentType: "image/webp" }),
      r2Upload({ key: thumbKey, body: processed.thumb, contentType: "image/webp" }),
    ]);
  } catch (err) {
    console.error("[/api/photos] R2 upload failed", err);
    return NextResponse.json({ error: "storage_upload_failed" }, { status: 502 });
  }

  // ── write to DB ──────────────────────────────────────────────────
  // Wrap in transaction so a partial DB failure doesn't leave us with
  // orphaned R2 objects (we'll attempt cleanup if the DB write fails).
  try {
    await db.transaction(async (tx) => {
      // Determine sort order — for vehicles, append; for users (single avatar) it's always 0
      let sortOrder = 0;
      if (subjectType === "vehicle") {
        const existing = await tx
          .select({ max: sql<number>`coalesce(max(${photos.sortOrder}), -1) + 1` })
          .from(photos)
          .where(
            and(
              eq(photos.subjectType, "vehicle"),
              eq(photos.subjectId, subjectId),
            ),
          );
        sortOrder = existing[0]?.max ?? 0;
      }

      // Insert the photo row
      await tx.insert(photos).values({
        id: photoId,
        uploaderId: userId,
        subjectType,
        subjectId,
        urlFull,
        urlThumb,
        width: processed.fullWidth,
        height: processed.fullHeight,
        exifJson: processed.exif as any,
        sortOrder,
      });

      // For profile photos: this REPLACES the user's avatar.
      // Delete the old avatar's R2 objects + DB row if one exists.
      if (subjectType === "user") {
        const oldAvatar = await tx
          .select({
            id: users.avatarPhotoId,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        await tx
          .update(users)
          .set({ avatarPhotoId: photoId, updatedAt: new Date() })
          .where(eq(users.id, userId));

        if (oldAvatar[0]?.id) {
          // Best-effort: delete old photo row + R2 objects.
          // Don't fail the request if this errors — the new avatar is set,
          // worst case we have a dangling photo row to clean up later.
          const oldPhotoId = oldAvatar[0].id;
          try {
            const [oldPhoto] = await tx
              .select({ urlFull: photos.urlFull, urlThumb: photos.urlThumb })
              .from(photos)
              .where(eq(photos.id, oldPhotoId))
              .limit(1);
            await tx.delete(photos).where(eq(photos.id, oldPhotoId));
            if (oldPhoto) {
              const fullK = r2KeyFromUrl(oldPhoto.urlFull);
              const thumbK = r2KeyFromUrl(oldPhoto.urlThumb);
              if (fullK) await r2Delete(fullK).catch(() => {});
              if (thumbK) await r2Delete(thumbK).catch(() => {});
            }
          } catch (e) {
            console.warn("[/api/photos] avatar replace cleanup failed", e);
          }
        }
      }

      // For vehicle photos: maybe set as primary
      if (subjectType === "vehicle" && isPrimary) {
        await tx
          .update(vehicles)
          .set({ primaryPhotoId: photoId })
          .where(eq(vehicles.id, subjectId));
      } else if (subjectType === "vehicle") {
        // If the vehicle doesn't have a primary yet, this becomes it
        const [v] = await tx
          .select({ primaryPhotoId: vehicles.primaryPhotoId })
          .from(vehicles)
          .where(eq(vehicles.id, subjectId))
          .limit(1);
        if (v && !v.primaryPhotoId) {
          await tx
            .update(vehicles)
            .set({ primaryPhotoId: photoId })
            .where(eq(vehicles.id, subjectId));
        }
      }
    });
  } catch (err) {
    // DB transaction failed — clean up R2 objects we just uploaded
    console.error("[/api/photos] DB transaction failed; cleaning up R2", err);
    await Promise.all([
      r2Delete(fullKey).catch(() => {}),
      r2Delete(thumbKey).catch(() => {}),
    ]);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({
    id: photoId,
    urlFull,
    urlThumb,
    width: processed.fullWidth,
    height: processed.fullHeight,
  });
}
