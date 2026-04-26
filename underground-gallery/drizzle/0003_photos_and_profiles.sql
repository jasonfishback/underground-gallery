-- Stage 2: photos + profile expansion
-- Adds: photos, app_settings, build_sections; bio + avatar to users; build sections to vehicles

-- ── users: bio + avatar pointer ────────────────────────────────────
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bio"             text,
  ADD COLUMN IF NOT EXISTS "avatar_photo_id" text;
-- bio limit enforced in app code (1000 chars), not DB, so it can be tuned without migration

-- ── photos table ───────────────────────────────────────────────────
-- Single source of truth for ALL photos in the system. Polymorphic via
-- (subject_type, subject_id). One row per photo, multiple resolutions
-- referenced by URL prefix (we generate /full/{id}.webp + /thumb/{id}.webp).
CREATE TABLE IF NOT EXISTS "photos" (
  "id"            text PRIMARY KEY,             -- nanoid, used as the R2 object key prefix
  "uploader_id"   text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "subject_type"  text NOT NULL,                 -- 'user' | 'vehicle'
  "subject_id"    text NOT NULL,                 -- users.id or vehicles.id
  "url_full"      text NOT NULL,                 -- public R2 URL for full-size webp
  "url_thumb"     text NOT NULL,                 -- public R2 URL for thumbnail webp
  "width"         integer NOT NULL,              -- intrinsic dimensions of url_full
  "height"        integer NOT NULL,
  "exif_json"     jsonb,                         -- preserved EXIF for admin viewing only
  "sort_order"    integer NOT NULL DEFAULT 0,    -- ordering within a vehicle's gallery
  "created_at"    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "photos_subject_type_check"
    CHECK ("subject_type" IN ('user', 'vehicle'))
);

CREATE INDEX IF NOT EXISTS "photos_subject_idx"
  ON "photos" ("subject_type", "subject_id", "sort_order");
CREATE INDEX IF NOT EXISTS "photos_uploader_idx"
  ON "photos" ("uploader_id");

-- Now that photos exists, add the FK from users.avatar_photo_id
-- (separate ALTER so we can drop/add safely if rerunning)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_avatar_photo_id_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_avatar_photo_id_fkey"
      FOREIGN KEY ("avatar_photo_id") REFERENCES "photos"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── vehicles: primary_photo_id + build sections ────────────────────
ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "primary_photo_id"   text,
  ADD COLUMN IF NOT EXISTS "build_exterior"     text,
  ADD COLUMN IF NOT EXISTS "build_interior"     text,
  ADD COLUMN IF NOT EXISTS "build_engine"       text,
  ADD COLUMN IF NOT EXISTS "build_suspension"   text,
  ADD COLUMN IF NOT EXISTS "build_wheels_tires" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicles_primary_photo_id_fkey'
  ) THEN
    ALTER TABLE "vehicles"
      ADD CONSTRAINT "vehicles_primary_photo_id_fkey"
      FOREIGN KEY ("primary_photo_id") REFERENCES "photos"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── app_settings ───────────────────────────────────────────────────
-- Key-value store for global toggles editable from the admin dashboard.
-- jsonb so values can be strings, bools, or structured config.
CREATE TABLE IF NOT EXISTS "app_settings" (
  "key"         text PRIMARY KEY,
  "value"       jsonb NOT NULL,
  "updated_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_by"  text REFERENCES "users"("id") ON DELETE SET NULL
);

-- Seed the default settings (won't overwrite existing values)
INSERT INTO "app_settings" ("key", "value")
VALUES
  ('require_profile_photo',  'false'::jsonb),
  ('require_vehicle_photos', 'false'::jsonb)
ON CONFLICT ("key") DO NOTHING;
