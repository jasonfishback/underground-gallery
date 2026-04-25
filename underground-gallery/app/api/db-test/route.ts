// app/api/db-test/route.ts
// Confirms the Postgres connection is alive.
//
// GET /api/db-test → { ok: true, now, version } when wired up correctly.
// Returns { ok: false, error } with a 500 if anything's wrong.
//
// This endpoint is purely diagnostic — safe to leave in for a while, but we'll
// remove it once Stage 1 is shipped. Doesn't touch any tables, just SELECT NOW().

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await sql`SELECT NOW() as now, version() as version`;
    const row = result[0];
    return NextResponse.json({
      ok: true,
      now: row.now,
      version: row.version,
    });
  } catch (err) {
    console.error('db-test error', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
