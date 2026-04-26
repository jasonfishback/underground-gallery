// lib/pusher/client.ts
'use client';

import PusherClient, { type Channel } from 'pusher-js';

let _pusher: PusherClient | null = null;

function getPusher(): PusherClient | null {
  if (_pusher) return _pusher;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn('[pusher-client] NEXT_PUBLIC_PUSHER_KEY/CLUSTER not set');
    }
    return null;
  }

  _pusher = new PusherClient(key, {
    cluster,
    authEndpoint: '/api/pusher/auth',
    forceTLS: true,
  });
  return _pusher;
}

/**
 * Subscribe to the race channel for a given challenge. Returns the channel
 * (which is also responsible for unsubscribe via channel.unbind_all() +
 * pusher.unsubscribe(channelName)).
 */
export function subscribeToRace(challengeId: string): Channel | null {
  const pusher = getPusher();
  if (!pusher) return null;
  return pusher.subscribe(`private-race-${challengeId}`);
}

export function unsubscribeFromRace(challengeId: string): void {
  const pusher = getPusher();
  if (!pusher) return;
  pusher.unsubscribe(`private-race-${challengeId}`);
}

export type { Channel };
