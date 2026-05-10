// scripts/apply-migration.mjs
//
// Apply a single .sql file against DATABASE_URL.
// Reads .env.local then opens a connection via the `postgres` lib that's
// already in dependencies, runs the SQL as one statement.
//
// Usage:
//   node scripts/apply-migration.mjs drizzle/0009_vehicle_name.sql

import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

// Lightweight .env.local loader — just enough to get DATABASE_URL.
function loadEnvLocal() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvLocal();

  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/apply-migration.mjs <path-to-sql>');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(sqlPath)) {
    console.error('File not found:', sqlPath);
    process.exit(1);
  }

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.error('DATABASE_URL not set. Run _refresh_env_dev.bat first.');
    process.exit(1);
  }

  const sqlText = fs.readFileSync(sqlPath, 'utf8');
  console.log(`\nApplying: ${sqlPath}`);
  console.log(`Target  : ${url.replace(/:[^@]+@/, ':****@')}`);
  console.log('---');
  console.log(sqlText);
  console.log('---\n');

  const sql = postgres(url, {
    ssl: 'require',
    max: 1,
    idle_timeout: 5,
  });

  try {
    await sql.unsafe(sqlText);
    console.log('OK — migration applied (or was already applied).');
  } catch (err) {
    console.error('FAIL —', err?.message ?? err);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main();
