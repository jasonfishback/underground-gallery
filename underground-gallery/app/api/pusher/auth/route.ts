// app/api/pusher/auth/route.ts
//
// Pusher private channel auth endpoint. Called by the client when it tries
// to subscribe to a `private-race-{challengeId}` channel. We verify:
//   1) the user is logged in
//   2) they are either the challenger or the opponent on that challenge
// Otherwise we return 403.

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { raceChallenges } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { authorizeChannel } from '@/lib/pusher/server';

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return new NextResponse('Unauthorized', { status: 401 });
  if (ctx.status !== 'active') return new NextResponse('Forbidden', { status: 403 });

  // Pusher sends application/x-www-form-urlencoded
  const formData = await req.formData();
  const socketId = formData.get('socket_id')?.toString();
  const channelName = formData.get('channel_name')?.toString();

  if (!socketId || !channelName) {
    return new NextResponse('Bad request', { status: 400 });
  }

  // Only authorize private-race-* channels here; reject anything else.
  const match = channelName.match(/^private-race-([0-9A-Za-z]+)$/);
  if (!match) {
    return new NextResponse('Forbidden channel', { status: 403 });
  }
  const challengeId = match[1];

  // Verify the user is a participant
  const [c] = await db
    .select({
      challengerUserId: raceChallenges.challengerUserId,
      opponentUserId: raceChallenges.opponentUserId,
    })
    .from(raceChallenges)
    .where(eq(raceChallenges.id, challengeId))
    .limit(1);

  if (!c) return new NextResponse('Challenge not found', { status: 404 });
  if (c.challengerUserId !== ctx.userId && c.opponentUserId !== ctx.userId) {
    return new NextResponse('Not a participant', { status: 403 });
  }

  const auth = authorizeChannel(socketId, channelName);
  if (!auth) return new NextResponse('Pusher not configured', { status: 503 });

  return NextResponse.json(auth);
}
