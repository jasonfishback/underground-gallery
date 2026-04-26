// lib/auth/gates.ts
//
// Thin adapter over the host app's Auth.js v5 `auth()` helper. The newer
// race/notifications/spectate code expects a uniform `getAuthContext()`
// returning a known shape, so this file bridges the two.
//
// If your existing pages already use `auth()` directly, keep doing that —
// this file only exists for code that imports `@/lib/auth/gates`.

import { auth } from '@/auth';

export type AuthContext = {
  userId: string;
  status: 'pending' | 'active' | 'rejected';
  setupCompleted: boolean;
  callsign: string | null;
  isModerator: boolean;
};

type AuthError = { _err: 'unauthorized' | 'pending' | 'setup_required' };

export function isAuthError(x: unknown): x is AuthError {
  return !!x && typeof x === 'object' && '_err' in (x as object);
}

/**
 * Returns the current user's auth context, or null if not signed in.
 * Reads from the Auth.js session — same source as the rest of your app.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const u = session.user as typeof session.user & {
    status?: 'pending' | 'active' | 'rejected';
    isModerator?: boolean;
    callsign?: string | null;
  };

  return {
    userId: u.id,
    status: u.status ?? 'pending',
    isModerator: u.isModerator ?? false,
    callsign: u.callsign ?? null,
    // Treat "has callsign" as "setup completed" — adjust if your schema
    // tracks setup separately.
    setupCompleted: !!u.callsign,
  };
}

/**
 * Same as getAuthContext but returns an error object instead of null when
 * the user is unauthorized / pending / hasn't completed setup. Server
 * actions use this so they can early-return cleanly.
 */
export async function requireSetupComplete(): Promise<AuthContext | AuthError> {
  const ctx = await getAuthContext();
  if (!ctx) return { _err: 'unauthorized' };
  if (ctx.status !== 'active') return { _err: 'pending' };
  if (!ctx.setupCompleted) return { _err: 'setup_required' };
  return ctx;
}
