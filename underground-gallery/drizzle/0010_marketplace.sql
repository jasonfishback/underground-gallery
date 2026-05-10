-- ============================================================================
-- 0010_marketplace.sql
-- Underground Marketplace v1: classifieds for cars and parts.
-- Members-only, contact-only (no payments). Reuses photos, notifications, flags.
--
-- Idempotent — safe to rerun.
-- ============================================================================

-- ── Extend photos.subject_type to include 'listing' ─────────────────────────
-- The photos table is polymorphic via subject_type + subject_id. Existing
-- enum (in code) is 'user' | 'vehicle'. The DB schema uses a free text
-- column, but if a CHECK constraint exists we need to drop/replace it.
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


-- ── Extend notifications.kind to cover marketplace events ───────────────────
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
      -- Marketplace
      'listing_message',
      'listing_offer_received', 'listing_offer_accepted', 'listing_offer_declined',
      'listing_watched_sold', 'listing_expiring_soon',
      'listing_flagged'
    ));
END $$;


-- ── flags.subject_type: extend to include 'listing' ─────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
             WHERE constraint_name = 'flags_subject_type_check') THEN
    ALTER TABLE "flags" DROP CONSTRAINT "flags_subject_type_check";
  END IF;
  -- Only add CHECK if the column is constrained today; otherwise leave it
  -- untouched (drizzle keeps the enum at the type level only).
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'flags' AND column_name = 'subject_type') THEN
    ALTER TABLE "flags"
      ADD CONSTRAINT "flags_subject_type_check"
      CHECK ("subject_type" IN ('photo', 'vehicle', 'user', 'listing'));
  END IF;
END $$;


-- ── listings ────────────────────────────────────────────────────────────────
-- One row per for-sale item. listing_type discriminates car vs. part.
-- Car-specific cols are nullable for parts and vice-versa.
CREATE TABLE IF NOT EXISTS "listings" (
  "id"                text PRIMARY KEY,
  "seller_id"         text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_type"      text NOT NULL,             -- 'car' | 'part'

  -- Common
  "title"             text NOT NULL,
  "description"       text,
  "price_cents"       integer,                   -- nullable to allow 'free' / 'trade'
  "currency"          text NOT NULL DEFAULT 'USD',
  "price_type"        text NOT NULL DEFAULT 'firm', -- 'firm' | 'obo' | 'trade' | 'free'
  "condition"         text NOT NULL,             -- 'new' | 'like_new' | 'used' | 'for_parts' | 'project'
  "status"            text NOT NULL DEFAULT 'draft',
                                                 -- 'draft' | 'active' | 'sold' | 'expired' | 'removed'
  "primary_photo_id"  text REFERENCES "photos"("id") ON DELETE SET NULL,
  "view_count"        integer NOT NULL DEFAULT 0,
  "favorite_count"    integer NOT NULL DEFAULT 0,

  -- Location (mirrors users region cols so we can do "near me")
  "location_label"    text,
  "location_lat"      double precision,
  "location_lng"      double precision,
  "location_country"  text,
  "location_admin1"   text,

  -- Lifecycle timestamps
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  "updated_at"        timestamptz NOT NULL DEFAULT now(),
  "published_at"      timestamptz,
  "expires_at"        timestamptz,
  "sold_at"           timestamptz,
  "bumped_at"         timestamptz,
  "removed_at"        timestamptz,

  -- ── Car-specific (NULL when listing_type='part')
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
  "title_status"      text,                      -- 'clean' | 'salvage' | 'rebuilt' | 'bonded' | 'other'
  "mods_summary"      text,

  -- ── Part-specific (NULL when listing_type='car')
  "part_category"     text,                      -- mirrors mod_catalog.category enum
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
  -- A car listing must at least know year/make/model
  CONSTRAINT "listings_car_required_fields"
    CHECK ("listing_type" <> 'car' OR ("year" IS NOT NULL AND "make" IS NOT NULL AND "model" IS NOT NULL)),
  -- A part listing must at least have a category
  CONSTRAINT "listings_part_required_fields"
    CHECK ("listing_type" <> 'part' OR "part_category" IS NOT NULL)
);

-- Browse / sort
CREATE INDEX IF NOT EXISTS "listings_browse_idx"
  ON "listings" ("status", "listing_type", "created_at" DESC);

-- Seller dashboard
CREATE INDEX IF NOT EXISTS "listings_seller_idx"
  ON "listings" ("seller_id", "status", "created_at" DESC);

-- Part filter: category
CREATE INDEX IF NOT EXISTS "listings_parts_category_idx"
  ON "listings" ("part_category", "status") WHERE "listing_type" = 'part';

-- Car filter: make/model/year
CREATE INDEX IF NOT EXISTS "listings_cars_mmy_idx"
  ON "listings" ("make", "model", "year") WHERE "listing_type" = 'car';

-- Cron sweep
CREATE INDEX IF NOT EXISTS "listings_expiry_idx"
  ON "listings" ("status", "expires_at") WHERE "status" = 'active';

-- Search by title (cheap prefix; good enough for v1, swap to pg_trgm later)
CREATE INDEX IF NOT EXISTS "listings_title_lower_idx"
  ON "listings" (LOWER("title")) WHERE "status" = 'active';


-- ── listing_messages ────────────────────────────────────────────────────────
-- Buyer-seller DMs scoped to a listing. We keep them per-listing so the
-- seller can have parallel conversations with multiple buyers.
CREATE TABLE IF NOT EXISTS "listing_messages" (
  "id"           text PRIMARY KEY,
  "listing_id"   text NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "from_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "to_user_id"   text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body"         text NOT NULL,
  "read_at"      timestamptz,
  "created_at"   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "listing_messages_no_self_dm"
    CHECK ("from_user_id" <> "to_user_id"),
  CONSTRAINT "listing_messages_body_nonempty"
    CHECK (length(trim("body")) > 0)
);

-- Thread between two specific users on a listing
CREATE INDEX IF NOT EXISTS "listing_messages_thread_idx"
  ON "listing_messages" ("listing_id", "from_user_id", "to_user_id", "created_at" DESC);

-- Inbox: messages to me, unread first
CREATE INDEX IF NOT EXISTS "listing_messages_inbox_idx"
  ON "listing_messages" ("to_user_id", "read_at" NULLS FIRST, "created_at" DESC);


-- ── listing_offers ──────────────────────────────────────────────────────────
-- Sub-asking-price offers. Buyer can withdraw, seller can accept/decline.
-- Acceptance is contact-only — no money changes hands here, it just signals
-- the seller agreed in principle to the price.
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
  CONSTRAINT "listing_offers_amount_positive"
    CHECK ("amount_cents" > 0)
);

CREATE INDEX IF NOT EXISTS "listing_offers_listing_idx"
  ON "listing_offers" ("listing_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "listing_offers_buyer_idx"
  ON "listing_offers" ("buyer_id", "created_at" DESC);


-- ── listing_watches ─────────────────────────────────────────────────────────
-- Watchlist / favorites. One row per (user, listing).
CREATE TABLE IF NOT EXISTS "listing_watches" (
  "id"         text PRIMARY KEY,
  "user_id"    text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" text NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "listing_watches_unique"
  ON "listing_watches" ("user_id", "listing_id");

CREATE INDEX IF NOT EXISTS "listing_watches_listing_idx"
  ON "listing_watches" ("listing_id");
