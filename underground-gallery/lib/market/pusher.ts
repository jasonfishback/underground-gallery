// lib/market/pusher.ts
//
// Marketplace-specific Pusher helpers. Mirrors lib/pusher/server.ts but
// for listing message channels.
//
// Channel naming:
//   private-listing-msg-<listingId>-<userIdLowSorted>-<userIdHighSorted>
// Always sort the two user IDs alphabetically so both clients subscribe to
// the same channel regardless of who initiates.

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
      console.warn('[market/pusher] credentials not configured — DMs will not be live');
    }
    return null;
  }
  _client = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return _client;
}

/**
 * Pusher channel name for a listing message thread between two users.
 *
 * UUIDs contain dashes, so we strip them in the channel name to keep
 * parsing trivial. The auth route does the same transform on `ctx.userId`
 * before comparing.
 */
export function listingThreadChannelName(listingId: string, userIdA: string, userIdB: string): string {
  const a = userIdA.replace(/-/g, '');
  const b = userIdB.replace(/-/g, '');
  const [low, high] = [a, b].sort();
  return `private-listing-msg-${listingId}-${low}-${high}`;
}

export async function publishListingMessage(
  listingId: string,
  userIdA: string,
  userIdB: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const client = getClient();
  if (!client) return;
  const channel = listingThreadChannelName(listingId, userIdA, userIdB);
  try {
    await client.trigger(channel, 'message', payload);
  } catch (err) {
    console.error('[market/pusher] trigger failed', { channel, err });
  }
}

export function authorizeListingChannel(socketId: string, channelName: string) {
  const client = getClient();
  if (!client) return null;
  try {
    return client.authorizeChannel(socketId, channelName);
  } catch (err) {
    console.error('[market/pusher] authorize failed', { channelName, err });
    return null;
  }
}
