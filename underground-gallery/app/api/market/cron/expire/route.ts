// app/api/market/cron/expire/route.ts
//
// Sweeps active listings whose expires_at is in the past, flips them to
// 'expired'. Designed to be called by Vercel cron once a day.
//
// Auth: Vercel cron sends `Authorization: Bearer <CRON_SECRET>`. We accept
// that, OR allow it in dev with no secret set.

import { NextRequest, NextResponse } from 'next/server';
import { eq, and, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return process.env.NODE_ENV !== 'production'; // dev: allow
  const got = req.headers.get('authorization');
  return got === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return new NextResponse('Unauthorized', { status: 401 });

  const result = await db
    .update(listings)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(and(eq(listings.status, 'active'), lt(listings.expiresAt, new Date())))
    .returning({ id: listings.id });

  return NextResponse.json({
    ok: true,
    expiredCount: result.length,
    expiredIds: result.map((r) => r.id),
  });
}
