// app/admin/market/actions.ts
//
// Admin actions on listings + flag queue.

'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { listings, flags } from '@/lib/db/schema';
import { requireSetupComplete, isAuthError } from '@/lib/auth/gates';

type Result = { ok: true } | { ok: false; error: string };

async function requireModerator() {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return null;
  if (!ctx.isModerator) return null;
  return ctx;
}

export async function adminRemoveListing(listingId: string, reason?: string): Promise<Result> {
  const ctx = await requireModerator();
  if (!ctx) return { ok: false, error: 'Not authorized' };
  await db
    .update(listings)
    .set({ status: 'removed', removedAt: new Date(), updatedAt: new Date() })
    .where(eq(listings.id, listingId));
  revalidatePath('/admin/market');
  revalidatePath(`/market/${listingId}`);
  return { ok: true };
}

export async function adminRestoreListing(listingId: string): Promise<Result> {
  const ctx = await requireModerator();
  if (!ctx) return { ok: false, error: 'Not authorized' };
  await db
    .update(listings)
    .set({ status: 'draft', removedAt: null, updatedAt: new Date() })
    .where(eq(listings.id, listingId));
  revalidatePath('/admin/market');
  return { ok: true };
}

export async function resolveFlag(flagId: string, resolution: 'resolved' | 'dismissed', note?: string): Promise<Result> {
  const ctx = await requireModerator();
  if (!ctx) return { ok: false, error: 'Not authorized' };
  await db
    .update(flags)
    .set({
      status: resolution,
      resolvedAt: new Date(),
      resolvedBy: ctx.userId,
      resolution: note ?? null,
    })
    .where(eq(flags.id, flagId));
  revalidatePath('/admin/market');
  return { ok: true };
}
