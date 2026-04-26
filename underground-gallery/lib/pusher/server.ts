// lib/pusher/server.ts
//
// Server-side Pusher client. Used in server actions and API routes to
// publish events ("race-start", "race-finish") to subscribed clients.
//
// All four env vars must be set or this module no-ops gracefully — that
// way local dev without Pusher creds still works (just no real-time sync).

import Pusher from 'pusher';

let _client: Pusher | null = null;

function getClient(): Pusher | null {
  if (_client) return _client;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[pusher] credentials not configured — real-time sync disabled');
    }
    return null;
  }

  _client = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
  return _client;
}

/**
 * Channel name for a race challenge. Private channels require auth via
 * /api/pusher/auth, where we verify the requesting user is one of the two
 * participants.
 */
export function raceChannelName(challengeId: string): string {
  return `private-race-${challengeId}`;
}

/**
 * Publish an event to a race channel. Best-effort — failures log but never
 * block the parent operation.
 */
export async function publishRaceEvent(
  challengeId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.trigger(raceChannelName(challengeId), event, data);
  } catch (err) {
    console.error('[pusher] trigger failed', { challengeId, event, err });
  }
}

/**
 * Authenticate a user for a private channel. Called by /api/pusher/auth.
 * Returns the auth signature object, or null if denied.
 */
export function authorizeChannel(
  socketId: string,
  channelName: string,
): { auth: string } | null {
  const client = getClient();
  if (!client) return null;
  try {
    return client.authorizeChannel(socketId, channelName);
  } catch (err) {
    console.error('[pusher] authorize failed', { socketId, channelName, err });
    return null;
  }
}
