// app/api/mod-preview/route.ts
//
// Owner-only visual mod preview. Takes a vehicle's hero photo, applies a
// selected visual mod (wheels / stance / carbon) with an identity-preserving
// image edit, stores the render in R2, and returns its URL.
//
// FREE WHILE TESTING: gated only by ownership + a soft per-user daily cap
// (KV, fails open if KV is unavailable). Paywall/credits wire in later.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { vehicles, photos } from '@/lib/db/schema';
import { r2Upload } from '@/lib/storage/r2';
import { getPreset } from '@/lib/mod-preview/presets';
import { runModEdit, availableProviders } from '@/lib/mod-preview/edit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // image edits can take 10-30s

const DAILY_CAP = Number(process.env.MOD_PREVIEW_DAILY_CAP || 15);

async function checkAndBumpQuota(userId: string): Promise<{ ok: boolean; remaining: number }> {
  // Soft cap via Vercel KV. If KV isn't configured, fail open (testing).
  try {
    const { kv } = await import('@vercel/kv');
    const day = new Date().toISOString().slice(0, 10);
    const key = `modpreview:${userId}:${day}`;
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, 60 * 60 * 26);
    const remaining = Math.max(0, DAILY_CAP - count);
    if (count > DAILY_CAP) {
      await kv.decr(key); // don't count the rejected attempt
      return { ok: false, remaining: 0 };
    }
    return { ok: true, remaining };
  } catch {
    return { ok: true, remaining: DAILY_CAP };
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
    }

    if (availableProviders().length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Mod preview is not configured yet — add a FAL_KEY or GOOGLE_API_KEY to enable it.',
        },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => null)) as
      | { vehicleId?: string; presetId?: string }
      | null;
    const vehicleId = body?.vehicleId;
    const presetId = body?.presetId;
    if (!vehicleId || !presetId) {
      return NextResponse.json({ ok: false, error: 'Missing vehicleId or presetId.' }, { status: 400 });
    }

    const preset = getPreset(presetId);
    if (!preset) {
      return NextResponse.json({ ok: false, error: 'Unknown mod.' }, { status: 400 });
    }

    // Ownership + hero photo
    const [v] = await db
      .select({ userId: vehicles.userId, primaryPhotoId: vehicles.primaryPhotoId })
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId))
      .limit(1);
    if (!v) return NextResponse.json({ ok: false, error: 'Vehicle not found.' }, { status: 404 });
    if (v.userId !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'Not your vehicle.' }, { status: 403 });
    }
    if (!v.primaryPhotoId) {
      return NextResponse.json(
        { ok: false, error: 'Add a photo of this car first — the preview needs a base image.' },
        { status: 400 },
      );
    }
    const [hero] = await db
      .select({ url: photos.urlFull })
      .from(photos)
      .where(eq(photos.id, v.primaryPhotoId))
      .limit(1);
    if (!hero?.url) {
      return NextResponse.json({ ok: false, error: 'Base photo not found.' }, { status: 400 });
    }

    // Soft daily cap
    const quota = await checkAndBumpQuota(session.user.id);
    if (!quota.ok) {
      return NextResponse.json(
        { ok: false, error: `Daily preview limit reached (${DAILY_CAP}/day). Try again tomorrow.` },
        { status: 429 },
      );
    }

    // Run the edit
    const result = await runModEdit({
      baseImageUrl: hero.url,
      change: preset.change,
      prefersReference: preset.prefersReference,
    });

    const ext = result.contentType.includes('png') ? 'png' : 'jpg';
    const key = `mod-previews/${vehicleId}/${randomUUID()}.${ext}`;
    const url = await r2Upload({ key, body: result.bytes, contentType: result.contentType });

    return NextResponse.json({
      ok: true,
      url,
      preset: { id: preset.id, label: preset.label, category: preset.category },
      provider: result.provider,
      remaining: quota.remaining,
    });
  } catch (err) {
    console.error('[/api/mod-preview] failed:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Preview failed.' },
      { status: 500 },
    );
  }
}
