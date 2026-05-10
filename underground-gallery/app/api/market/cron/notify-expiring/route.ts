// app/api/market/cron/notify-expiring/route.ts
//
// Notifies sellers whose listings expire in 3 days (or less). Run daily.
// Idempotent: only sends if there's no recent listing_expiring_soon
// notification for this listing in the last 6 days.

import { NextRequest, NextResponse } from 'next/server';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { listings, notifications } from '@/lib/db/schema';
import { notifyExpiringSoon } from '@/lib/market/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return process.env.NODE_ENV !== 'production';
  const got = req.headers.get('authorization');
  return got === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return new NextResponse('Unauthorized', { status: 401 });

  const now = new Date();
  const cutoff = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
  const recencyCutoff = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

  const expiring = await db
    .select({
      id: listings.id,
      title: listings.title,
      sellerId: listings.sellerId,
      expiresAt: listings.expiresAt,
    })
    .from(listings)
    .where(
      and(
        eq(listings.status, 'active'),
        sql`${listings.expiresAt} IS NOT NULL`,
        lt(listings.expiresAt, cutoff),
        gte(listings.expiresAt, now),
      ),
    );

  let sent = 0;
  for (const l of expiring) {
    if (!l.expiresAt) continue;
    // Skip if we already pinged this seller for this listing recently
    const [recent] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, l.sellerId),
          eq(notifications.kind, 'listing_expiring_soon'),
          gte(notifications.createdAt, recencyCutoff),
          sql`${notifications.metadata}->>'listingId' = ${l.id}`,
        ),
      )
      .limit(1);
    if (recent) continue;

    const daysLeft = Math.max(
      1,
      Math.ceil((l.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    );
    await notifyExpiringSoon({
      sellerId: l.sellerId,
      listingTitle: l.title,
      listingId: l.id,
      daysLeft,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, candidates: expiring.length, sent });
}
