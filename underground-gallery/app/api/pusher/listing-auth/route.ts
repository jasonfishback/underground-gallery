// app/api/pusher/listing-auth/route.ts
//
// Pusher private channel auth for marketplace listing message threads.
// Channel format: private-listing-msg-<listingId>-<userIdLowSorted>-<userIdHighSorted>
// We auth the user only when they are one of the two userIds in the channel name.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { authorizeListingChannel } from '@/lib/market/pusher';

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return new NextResponse('Unauthorized', { status: 401 });
  if (ctx.status !== 'active') return new NextResponse('Forbidden', { status: 403 });

  const formData = await req.formData();
  const socketId = formData.get('socket_id')?.toString();
  const channelName = formData.get('channel_name')?.toString();
  if (!socketId || !channelName) {
    return new NextResponse('Bad request', { status: 400 });
  }

  // Channel format: private-listing-msg-<listingId>-<userA>-<userB>
  // where userA / userB are UUIDs with dashes stripped (to keep the parse
  // unambiguous). listingId is a 12-char nanoid, dashless.
  const match = channelName.match(/^private-listing-msg-([^-]+)-([0-9a-f]{32})-([0-9a-f]{32})$/);
  if (!match) return new NextResponse('Forbidden channel', { status: 403 });

  const [, listingId, userA, userB] = match;
  const myStripped = ctx.userId.replace(/-/g, '');
  if (myStripped !== userA && myStripped !== userB) {
    return new NextResponse('Not a participant', { status: 403 });
  }

  // Sanity-check the listing exists (not strictly required but rejects junk)
  const [l] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!l) return new NextResponse('Listing not found', { status: 404 });

  const auth = authorizeListingChannel(socketId, channelName);
  if (!auth) return new NextResponse('Pusher not configured', { status: 503 });

  return NextResponse.json(auth);
}
