// app/api/db-init/marketplace/route.ts
//
// One-shot endpoint to run the 0010_marketplace.sql migration through the
// deployed app. Same auth model as /api/db-init: requires
//   Authorization: Bearer <ADMIN_TOKEN>
//
// Idempotent — every CREATE TABLE / CREATE INDEX uses IF NOT EXISTS, and the
// CHECK-constraint blocks DROP-and-re-add so you can rerun safely.

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

export async function POST(req: Request) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TOKEN env var not configured' },
      { status: 500 },
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const log: string[] = [];
  const step = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      log.push(`✓ ${label}`);
    } catch (err) {
      log.push(`✗ ${label}: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  };

  try {
    // ── extend photos.subject_type CHECK constraint ─────────────────────────
    await step('photos.subject_type CHECK', async () => {
      await sql.unsafe(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                     WHERE constraint_name = 'photos_subject_type_check') THEN
            ALTER TABLE "photos" DROP CONSTRAINT "photos_subject_type_check";
          END IF;
          ALTER TABLE "photos"
            ADD CONSTRAINT "photos_subject_type_check"
            CHECK ("subject_type" IN ('user', 'vehicle', 'listing'));
        END $$;
      `);
    });

    // ── extend notifications.kind CHECK constraint ──────────────────────────
    await step('notifications.kind CHECK', async () => {
      await sql.unsafe(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                     WHERE constraint_name = 'notifications_kind_check') THEN
            ALTER TABLE "notifications" DROP CONSTRAINT "notifications_kind_check";
          END IF;
          ALTER TABLE "notifications"
            ADD CONSTRAINT "notifications_kind_check"
            CHECK ("kind" IN (
              'challenge_received', 'challenge_accepted', 'challenge_declined',
              'race_completed', 'race_practice_run',
              'photo_flagged', 'application_decision', 'system',
              'listing_message',
              'listing_offer_received', 'listing_offer_accepted', 'listing_offer_declined',
              'listing_watched_sold', 'listing_expiring_soon',
              'listing_flagged'
            ));
        END $$;
      `);
    });

    // ── extend flags.subject_type ──────────────────────────────────────────
    await step('flags.subject_type CHECK', async () => {
      await sql.unsafe(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints
                     WHERE constraint_name = 'flags_subject_type_check') THEN
            ALTER TABLE "flags" DROP CONSTRAINT "flags_subject_type_check";
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name = 'flags' AND column_name = 'subject_type') THEN
            ALTER TABLE "flags"
              ADD CONSTRAINT "flags_subject_type_check"
              CHECK ("subject_type" IN ('photo', 'vehicle', 'user', 'listing'));
          END IF;
        END $$;
      `);
    });

    // ── listings table ──────────────────────────────────────────────────────
    await step('listings table', async () => {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS "listings" (
          "id"                text PRIMARY KEY,
          "seller_id"         text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "listing_type"      text NOT NULL,
          "title"             text NOT NULL,
          "description"       text,
          "price_cents"       integer,
          "currency"          text NOT NULL DEFAULT 'USD',
          "price_type"        text NOT NULL DEFAULT 'firm',
          "condition"         text NOT NULL,
          "status"            text NOT NULL DEFAULT 'draft',
          "primary_photo_id"  text REFERENCES "photos"("id") ON DELETE SET NULL,
          "view_count"        integer NOT NULL DEFAULT 0,
          "favorite_count"    integer NOT NULL DEFAULT 0,
          "location_label"    text,
          "location_lat"      double precision,
          "location_lng"      double precision,
          "location_country"  text,
          "location_admin1"   text,
          "created_at"        timestamptz NOT NULL DEFAULT now(),
          "updated_at"        timestamptz NOT NULL DEFAULT now(),
          "published_at"      timestamptz,
          "expires_at"        timestamptz,
          "sold_at"           timestamptz,
          "bumped_at"         timestamptz,
          "removed_at"        timestamptz,
          "garage_vehicle_id" text REFERENCES "vehicles"("id") ON DELETE SET NULL,
          "year"              integer,
          "make"              text,
          "model"             text,
          "trim"              text,
          "body_style"        text,
          "vin"               text,
          "mileage"           integer,
          "color"             text,
          "transmission"      text,
          "drivetrain"        text,
          "title_status"      text,
          "mods_summary"      text,
          "part_category"     text,
          "part_brand"        text,
          "part_number"       text,
          "oem_number"        text,
          "fitment_make"      text,
          "fitment_model"     text,
          "fitment_year_from" integer,
          "fitment_year_to"   integer,
          "fitment_trim"      text,
          "fitment_notes"     text,
          "quantity"          integer NOT NULL DEFAULT 1,
          CONSTRAINT "listings_type_check"
            CHECK ("listing_type" IN ('car', 'part')),
          CONSTRAINT "listings_status_check"
            CHECK ("status" IN ('draft', 'active', 'sold', 'expired', 'removed')),
          CONSTRAINT "listings_condition_check"
            CHECK ("condition" IN ('new', 'like_new', 'used', 'for_parts', 'project')),
          CONSTRAINT "listings_price_type_check"
            CHECK ("price_type" IN ('firm', 'obo', 'trade', 'free')),
          CONSTRAINT "listings_title_status_check"
            CHECK ("title_status" IS NULL OR "title_status" IN ('clean', 'salvage', 'rebuilt', 'bonded', 'other')),
          CONSTRAINT "listings_car_required_fields"
            CHECK ("listing_type" <> 'car' OR ("year" IS NOT NULL AND "make" IS NOT NULL AND "model" IS NOT NULL)),
          CONSTRAINT "listings_part_required_fields"
            CHECK ("listing_type" <> 'part' OR "part_category" IS NOT NULL)
        );
      `);
    });

    // ── listings indexes ────────────────────────────────────────────────────
    await step('listings indexes', async () => {
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listings_browse_idx" ON "listings" ("status", "listing_type", "created_at" DESC);`);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listings_seller_idx" ON "listings" ("seller_id", "status", "created_at" DESC);`);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listings_parts_category_idx" ON "listings" ("part_category", "status") WHERE "listing_type" = 'part';`);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listings_cars_mmy_idx" ON "listings" ("make", "model", "year") WHERE "listing_type" = 'car';`);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listings_expiry_idx" ON "listings" ("status", "expires_at") WHERE "status" = 'active';`);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listings_title_lower_idx" ON "listings" (LOWER("title")) WHERE "status" = 'active';`);
    });

    // ── listing_messages ────────────────────────────────────────────────────
    await step('listing_messages table', async () => {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS "listing_messages" (
          "id"           text PRIMARY KEY,
          "listing_id"   text NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
          "from_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "to_user_id"   text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "body"         text NOT NULL,
          "read_at"      timestamptz,
          "created_at"   timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT "listing_messages_no_self_dm" CHECK ("from_user_id" <> "to_user_id"),
          CONSTRAINT "listing_messages_body_nonempty" CHECK (length(trim("body")) > 0)
        );
      `);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listing_messages_thread_idx" ON "listing_messages" ("listing_id", "from_user_id", "to_user_id", "created_at" DESC);`);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listing_messages_inbox_idx" ON "listing_messages" ("to_user_id", "read_at" NULLS FIRST, "created_at" DESC);`);
    });

    // ── listing_offers ──────────────────────────────────────────────────────
    await step('listing_offers table', async () => {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS "listing_offers" (
          "id"           text PRIMARY KEY,
          "listing_id"   text NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
          "buyer_id"     text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "amount_cents" integer NOT NULL,
          "currency"     text NOT NULL DEFAULT 'USD',
          "message"      text,
          "status"       text NOT NULL DEFAULT 'pending',
          "created_at"   timestamptz NOT NULL DEFAULT now(),
          "responded_at" timestamptz,
          "expires_at"   timestamptz NOT NULL,
          CONSTRAINT "listing_offers_status_check"
            CHECK ("status" IN ('pending', 'accepted', 'declined', 'withdrawn', 'expired')),
          CONSTRAINT "listing_offers_amount_positive" CHECK ("amount_cents" > 0)
        );
      `);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listing_offers_listing_idx" ON "listing_offers" ("listing_id", "status", "created_at" DESC);`);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listing_offers_buyer_idx" ON "listing_offers" ("buyer_id", "created_at" DESC);`);
    });

    // ── listing_watches ─────────────────────────────────────────────────────
    await step('listing_watches table', async () => {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS "listing_watches" (
          "id"         text PRIMARY KEY,
          "user_id"    text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "listing_id" text NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
          "created_at" timestamptz NOT NULL DEFAULT now()
        );
      `);
      await sql.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "listing_watches_unique" ON "listing_watches" ("user_id", "listing_id");`);
      await sql.unsafe(`CREATE INDEX IF NOT EXISTS "listing_watches_listing_idx" ON "listing_watches" ("listing_id");`);
    });

    // ── verify ──────────────────────────────────────────────────────────────
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('listings', 'listing_messages', 'listing_offers', 'listing_watches')
      ORDER BY table_name
    `;

    return NextResponse.json({
      ok: true,
      log,
      marketplace_tables: tables.map((t) => t.table_name),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        log,
      },
      { status: 500 },
    );
  }
}

// GET — quick health check (no auth needed)
export async function GET() {
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('listings', 'listing_messages', 'listing_offers', 'listing_watches')
      ORDER BY table_name
    `;
    return NextResponse.json({
      ok: true,
      marketplace_tables: tables.map((t) => t.table_name),
      ready: tables.length === 4,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
