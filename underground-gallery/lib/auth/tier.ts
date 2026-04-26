// lib/auth/tier.ts
//
// User tier reconciliation. Stage 2 Part 2 introduced membership tiers
// (e.g. featured, verified, etc.) with auto-promotion based on activity
// (photo count, vehicle count). reconcileTier() recomputes a user's tier
// after they take an action that might bump them up or down.
//
// This is a no-op stub for now — the host app's existing tier logic (if
// any) will replace it. The garage actions call it after CRUD so when
// you wire in real tier rules later, they'll already be invoked from the
// right places.

export async function reconcileTier(_userId: string): Promise<void> {
  // No-op. Real implementation goes here.
  return;
}
