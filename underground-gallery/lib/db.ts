// lib/db.ts
// Postgres connection for Underground Gallery.
//
// In production on Vercel, DATABASE_URL is auto-injected when Neon Postgres
// is connected via the Storage tab. We use the `postgres` driver under
// drizzle-orm — small, fast, and works well with Neon's serverless pooler.
//
// IMPORTANT: connections are cached on globalThis in dev so that Next.js
// hot reloads don't open a new pool every time a file changes.

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Connect Neon Postgres via Vercel → Storage tab, ' +
    'or pull env vars locally with `vercel env pull .env.local`.'
  );
}

// Cache the connection across hot reloads in dev
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    max: 1,                  // serverless: one connection per function instance
    idle_timeout: 20,        // close idle connections after 20s
    connect_timeout: 10,     // fail fast if Neon is unreachable
    prepare: false,          // required for Neon's pooler
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client;
}

export const db = drizzle(client);
export const sql = client; // raw access for ad-hoc queries
