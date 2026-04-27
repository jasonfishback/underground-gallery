// ============================================================================
// app/api/photos/upload/route.ts
// Owner-only photo upload endpoint for /v/[id].
// Accepts multipart/form-data with `vehicleId` + `file` fields.
// Verifies ownership, uploads to R2 via existing r2Upload helper, and
// inserts a row into the photos table. Returns the new photo record.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { vehicles, photos } from "@/lib/db/schema";
import { r2Upload } from "@/lib/storage/r2";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Not signed in." },
        { status: 401 },
      );
    }

    const form = await req.formData();
    const vehicleId = form.get("vehicleId");
    const file = form.get("file");

    if (typeof vehicleId !== "string" || !vehicleId) {
      return NextResponse.json(
        { ok: false, error: "Missing vehicleId." },
        { status: 400 },
      );
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "Missing file." },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File must be 1 byte to 12 MB." },
        { status: 400 },
      );
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Only JPEG, PNG, or WebP images allowed." },
        { status: 400 },
      );
    }

    // Ownership check
    const [v_row] = await db.select({ id: vehicles.id, userId: vehicles.userId, primaryPhotoId: vehicles.primaryPhotoId }).from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
    const vehicle = v_row;
    if (!vehicle) {
      return NextResponse.json(
        { ok: false, error: "Vehicle not found." },
        { status: 404 },
      );
    }
    if (vehicle.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Not your vehicle." },
        { status: 403 },
      );
    }

    // Upload to R2
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const photoId = randomUUID();
    const key = `vehicles/${vehicleId}/${photoId}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const url = await r2Upload({
      key,
      body: buf,
      contentType: file.type,
    });

    // DB insert
    await db.insert(photos).values({
      id: photoId,
      uploaderId: session.user.id,
      subjectType: "vehicle",
      subjectId: vehicleId,
      urlFull: url,
      urlThumb: url, // no separate thumb pipeline yet
      width: 0,
      height: 0,
      exifJson: null,
      sortOrder: 0,
    } as any);

    // If vehicle has no hero photo yet, set this one as the hero.
    if (!vehicle.primaryPhotoId) {
      await db
        .update(vehicles)
        .set({ primaryPhotoId: photoId })
        .where(eq(vehicles.id, vehicleId));
    }

    return NextResponse.json({
      ok: true,
      photo: {
        id: photoId,
        url,
        isHero: !vehicle.primaryPhotoId,
      },
    });
  } catch (err) {
    console.error("[/api/photos/upload] failed:", err);
    return NextResponse.json(
      { ok: false, error: "Upload failed." },
      { status: 500 },
    );
  }
}
