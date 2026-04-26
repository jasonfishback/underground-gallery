// app/me/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, vehicles, photos } from "@/lib/db/schema";
import {
  profileUpdateSchema,
  vehicleEditSchema,
  vehicleBuildSchema,
  type ProfileUpdate,
  type VehicleEdit,
  type VehicleBuild,
} from "@/lib/validation/profile";
import { r2Delete, r2KeyFromUrl } from "@/lib/storage/r2";

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string; field?: string };

async function requireActiveUser(): Promise<{ userId: string } | { error: string; status: number }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in", status: 401 };
  if (session.user.status !== "active") return { error: "Not approved", status: 403 };
  return { userId: session.user.id };
}

// ── Profile update (bio, region) ─────────────────────────────────────
export async function updateProfile(raw: ProfileUpdate): Promise<Result> {
  const ctx = await requireActiveUser();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid input", field: issue?.path.join(".") };
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.bio !== undefined) update.bio = parsed.data.bio || null;
  if (parsed.data.region) {
    update.regionPlaceId = parsed.data.region.placeId;
    update.regionLabel = parsed.data.region.label;
    update.regionLat = parsed.data.region.lat;
    update.regionLng = parsed.data.region.lng;
    update.regionCountry = parsed.data.region.country ?? null;
    update.regionAdmin1 = parsed.data.region.admin1 ?? null;
  }

  await db.update(users).set(update).where(eq(users.id, ctx.userId));
  revalidatePath("/me");
  return { ok: true };
}

// ── Vehicle CRUD ─────────────────────────────────────────────────────
export async function createVehicle(raw: VehicleEdit): Promise<Result<{ id: string }>> {
  const ctx = await requireActiveUser();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = vehicleEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { customAlphabet } = await import("nanoid");
  const newId = customAlphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz", 10)();

  // Determine if this is the user's first vehicle (auto-mark as primary)
  const existing = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(eq(vehicles.userId, ctx.userId))
    .limit(1);
  const isFirst = existing.length === 0;

  await db.insert(vehicles).values({
    id: newId,
    userId: ctx.userId,
    year: parsed.data.year,
    make: parsed.data.make,
    model: parsed.data.model,
    trim: parsed.data.trim || null,
    notes: parsed.data.notes || null,
    isPrimary: isFirst,
  });

  revalidatePath("/me");
  return { ok: true, data: { id: newId } };
}

export async function updateVehicle(
  vehicleId: string,
  raw: VehicleEdit,
): Promise<Result> {
  const ctx = await requireActiveUser();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = vehicleEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Authorization: must own the vehicle
  const owned = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (owned.length === 0 || owned[0].userId !== ctx.userId) {
    return { ok: false, error: "Vehicle not found" };
  }

  await db
    .update(vehicles)
    .set({
      year: parsed.data.year,
      make: parsed.data.make,
      model: parsed.data.model,
      trim: parsed.data.trim || null,
      notes: parsed.data.notes || null,
    })
    .where(eq(vehicles.id, vehicleId));

  revalidatePath("/me");
  revalidatePath(`/v/${vehicleId}`);
  return { ok: true };
}

export async function updateVehicleBuild(
  vehicleId: string,
  raw: VehicleBuild,
): Promise<Result> {
  const ctx = await requireActiveUser();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const parsed = vehicleBuildSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const owned = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (owned.length === 0 || owned[0].userId !== ctx.userId) {
    return { ok: false, error: "Vehicle not found" };
  }

  await db
    .update(vehicles)
    .set({
      buildExterior: parsed.data.buildExterior || null,
      buildInterior: parsed.data.buildInterior || null,
      buildEngine: parsed.data.buildEngine || null,
      buildSuspension: parsed.data.buildSuspension || null,
      buildWheelsTires: parsed.data.buildWheelsTires || null,
    })
    .where(eq(vehicles.id, vehicleId));

  revalidatePath("/me");
  revalidatePath(`/v/${vehicleId}`);
  return { ok: true };
}

export async function deleteVehicle(vehicleId: string): Promise<Result> {
  const ctx = await requireActiveUser();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  // Authorization + load photos to clean up R2
  const veh = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (veh.length === 0 || veh[0].userId !== ctx.userId) {
    return { ok: false, error: "Vehicle not found" };
  }

  const photoRows = await db
    .select({ id: photos.id, urlFull: photos.urlFull, urlThumb: photos.urlThumb })
    .from(photos)
    .where(and(eq(photos.subjectType, "vehicle"), eq(photos.subjectId, vehicleId)));

  // DB delete first (cascade will handle photos rows via FK)
  await db.delete(vehicles).where(eq(vehicles.id, vehicleId));

  // Then best-effort R2 cleanup
  await Promise.allSettled(
    photoRows.flatMap((p) => {
      const fullKey = r2KeyFromUrl(p.urlFull);
      const thumbKey = r2KeyFromUrl(p.urlThumb);
      return [
        fullKey ? r2Delete(fullKey) : Promise.resolve(),
        thumbKey ? r2Delete(thumbKey) : Promise.resolve(),
      ];
    }),
  );

  revalidatePath("/me");
  return { ok: true };
}

// ── Photo management (delete, reorder, set primary) ──────────────────
export async function deletePhoto(photoId: string): Promise<Result> {
  const ctx = await requireActiveUser();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  // Owner check via uploader_id
  const photo = await db
    .select({
      uploaderId: photos.uploaderId,
      subjectType: photos.subjectType,
      subjectId: photos.subjectId,
      urlFull: photos.urlFull,
      urlThumb: photos.urlThumb,
    })
    .from(photos)
    .where(eq(photos.id, photoId))
    .limit(1);

  if (photo.length === 0 || photo[0].uploaderId !== ctx.userId) {
    return { ok: false, error: "Photo not found" };
  }
  const p = photo[0];

  await db.delete(photos).where(eq(photos.id, photoId));

  // R2 cleanup
  const fullKey = r2KeyFromUrl(p.urlFull);
  const thumbKey = r2KeyFromUrl(p.urlThumb);
  await Promise.allSettled([
    fullKey ? r2Delete(fullKey) : Promise.resolve(),
    thumbKey ? r2Delete(thumbKey) : Promise.resolve(),
  ]);

  revalidatePath("/me");
  if (p.subjectType === "vehicle") revalidatePath(`/v/${p.subjectId}`);
  return { ok: true };
}

export async function setPrimaryVehiclePhoto(
  vehicleId: string,
  photoId: string,
): Promise<Result> {
  const ctx = await requireActiveUser();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  // Check ownership of vehicle and that the photo belongs to it
  const veh = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (veh.length === 0 || veh[0].userId !== ctx.userId) {
    return { ok: false, error: "Vehicle not found" };
  }

  const photo = await db
    .select({ subjectType: photos.subjectType, subjectId: photos.subjectId })
    .from(photos)
    .where(eq(photos.id, photoId))
    .limit(1);
  if (
    photo.length === 0 ||
    photo[0].subjectType !== "vehicle" ||
    photo[0].subjectId !== vehicleId
  ) {
    return { ok: false, error: "Photo not on this vehicle" };
  }

  await db
    .update(vehicles)
    .set({ primaryPhotoId: photoId })
    .where(eq(vehicles.id, vehicleId));

  revalidatePath("/me");
  revalidatePath(`/v/${vehicleId}`);
  return { ok: true };
}

export async function reorderVehiclePhotos(
  vehicleId: string,
  orderedPhotoIds: string[],
): Promise<Result> {
  const ctx = await requireActiveUser();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const veh = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (veh.length === 0 || veh[0].userId !== ctx.userId) {
    return { ok: false, error: "Vehicle not found" };
  }

  // Update sort_order in a single transaction
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedPhotoIds.length; i++) {
      await tx
        .update(photos)
        .set({ sortOrder: i })
        .where(
          and(
            eq(photos.id, orderedPhotoIds[i]),
            eq(photos.subjectType, "vehicle"),
            eq(photos.subjectId, vehicleId),
          ),
        );
    }
  });

  revalidatePath(`/v/${vehicleId}`);
  return { ok: true };
}
