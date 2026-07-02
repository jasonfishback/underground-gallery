// app/garage/build-actions.ts
// Server actions for the Build Log (build_entries). Owner-only CRUD.
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { vehicles, buildEntries, BUILD_CATEGORIES } from '@/lib/db/schema';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const newId = customAlphabet(
  '0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz',
  12,
);

const buildEntrySchema = z.object({
  title: z.string().trim().min(1, 'Give this update a title.').max(120),
  category: z.enum(BUILD_CATEGORIES).nullable().optional(),
  body: z.string().trim().max(5000).optional(),
  // "YYYY-MM-DD" from an <input type="date">
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date.').optional(),
  costCents: z.number().int().min(0).max(100_000_000).nullable().optional(),
});

async function requireVehicleOwner(
  vehicleId: string,
): Promise<{ userId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Not signed in' };

  const [v] = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (!v || v.userId !== session.user.id) return { error: 'Vehicle not found' };
  return { userId: session.user.id };
}

// Parse "YYYY-MM-DD" at local noon UTC so the date survives timezone shifts.
function parseEntryDate(s: string | undefined): Date {
  if (!s) return new Date();
  return new Date(`${s}T12:00:00Z`);
}

export async function createBuildEntry(
  vehicleId: string,
  raw: unknown,
): Promise<Result<{ entryId: string }>> {
  const ctx = await requireVehicleOwner(vehicleId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const parsed = buildEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const entryId = newId();
  await db.insert(buildEntries).values({
    id: entryId,
    vehicleId,
    title: parsed.data.title,
    category: parsed.data.category ?? null,
    body: parsed.data.body || null,
    costCents: parsed.data.costCents ?? null,
    entryDate: parseEntryDate(parsed.data.entryDate),
  });

  revalidatePath(`/v/${vehicleId}`);
  return { ok: true, data: { entryId } };
}

export async function updateBuildEntry(
  entryId: string,
  raw: unknown,
): Promise<Result> {
  const [entry] = await db
    .select({ vehicleId: buildEntries.vehicleId })
    .from(buildEntries)
    .where(eq(buildEntries.id, entryId))
    .limit(1);
  if (!entry) return { ok: false, error: 'Entry not found' };

  const ctx = await requireVehicleOwner(entry.vehicleId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  const parsed = buildEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  await db
    .update(buildEntries)
    .set({
      title: parsed.data.title,
      category: parsed.data.category ?? null,
      body: parsed.data.body || null,
      costCents: parsed.data.costCents ?? null,
      entryDate: parseEntryDate(parsed.data.entryDate),
      updatedAt: new Date(),
    })
    .where(eq(buildEntries.id, entryId));

  revalidatePath(`/v/${entry.vehicleId}`);
  return { ok: true };
}

export async function deleteBuildEntry(entryId: string): Promise<Result> {
  const [entry] = await db
    .select({ vehicleId: buildEntries.vehicleId })
    .from(buildEntries)
    .where(eq(buildEntries.id, entryId))
    .limit(1);
  if (!entry) return { ok: false, error: 'Entry not found' };

  const ctx = await requireVehicleOwner(entry.vehicleId);
  if ('error' in ctx) return { ok: false, error: ctx.error };

  // photos.build_entry_id is ON DELETE SET NULL — photos stay in the gallery.
  await db.delete(buildEntries).where(eq(buildEntries.id, entryId));

  revalidatePath(`/v/${entry.vehicleId}`);
  return { ok: true };
}
