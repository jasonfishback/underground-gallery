// app/api/db-init/route.ts
// One-shot table creation endpoint.
//
// Hit POST /api/db-init with header `Authorization: Bearer <ADMIN_TOKEN>` to create
// all tables. Idempotent — uses `CREATE TABLE IF NOT EXISTS` so it's safe to re-run.
//
// We use raw SQL here (not Drizzle's migration system) because:
//   1. No CLI access in our GitHub-web-UI workflow
//   2. Schema changes are still infrequent at this stage
//
// Once the schema stabilizes we'll move to proper Drizzle migrations.

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export async function POST(req: Request) {
  // Auth check
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN env var not configured' },
      { status: 500 }
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const created: string[] = [];

  try {
    // ─── users ─────────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        email_verified TIMESTAMPTZ,
        name TEXT,
        image TEXT,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'active', 'rejected')),
        callsign TEXT,
        region TEXT,
        is_moderator BOOLEAN NOT NULL DEFAULT FALSE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        approved_at TIMESTAMPTZ,
        rejected_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_callsign_idx ON users (callsign)`;
    await sql`CREATE INDEX IF NOT EXISTS users_status_idx ON users (status)`;
    created.push('users');

    // ─── accounts ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        PRIMARY KEY (provider, provider_account_id)
      )
    `;
    created.push('accounts');

    // ─── sessions ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        session_token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMPTZ NOT NULL
      )
    `;
    created.push('sessions');

    // ─── verification_tokens ───────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;
    created.push('verification_tokens');

    // ─── applications ──────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        callsign TEXT,
        region TEXT,
        drive TEXT,
        instagram TEXT,
        invited_by TEXT,
        message TEXT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS applications_user_id_idx ON applications (user_id)`;
    created.push('applications');

    // ─── Verify what's there ────────────────────────────────────────────
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    return NextResponse.json({
      ok: true,
      created,
      existing_tables: tables.map((t) => t.table_name),
    });
  } catch (err) {
    console.error('db-init error', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        created_so_far: created,
      },
      { status: 500 }
    );
  }
}

// Also support GET for a quick dry-run check (no auth needed — read-only).
// Just lists what tables currently exist.
export async function GET() {
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    return NextResponse.json({
      ok: true,
      existing_tables: tables.map((t) => t.table_name),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
