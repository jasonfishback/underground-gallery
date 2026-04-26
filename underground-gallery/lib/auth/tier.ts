// lib/auth/tier.ts
//
// User tier reconciliation. Stage 2 Part 2 introduced membership tiers
// with auto-promotion based on activity. reconcileTier() recomputes a
// user's tier after they take an action that might bump them up or down.
//
// Accepts an optional Drizzle transaction as the first arg so callers
// inside `db.transaction(async (tx) => { ... })` can pass it through.
// This is a no-op stub for now — your existing tier logic (if any) goes here.

export async function reconcileTier(_txOrUserId: unknown, _userId?: string): Promise<void> {
  return;
}
