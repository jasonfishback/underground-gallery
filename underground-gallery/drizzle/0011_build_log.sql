-- ============================================================================
-- 0011_build_log.sql
-- Build Log: dated, photo-backed build documentation per vehicle.
-- Replaces the unused flat build_* text columns as the way owners document
-- their builds. Photos attach to entries via photos.build_entry_id and keep
-- subject_type='vehicle' so they ALSO appear in the car's main gallery.
-- Idempotent — safe to run more than once (same convention as 0010).
-- ============================================================================

CREATE TABLE IF NOT EXISTS "build_entries" (
  "id"          text PRIMARY KEY,
  "vehicle_id"  text NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "title"       text NOT NULL,
  "category"    text,
  "body"        text,
  "cost_cents"  integer,
  "entry_date"  timestamptz NOT NULL DEFAULT now(),
  "created_at"  timestamptz NOT NULL DEFAULT now(),
  "updated_at"  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "build_entries_vehicle_idx"
  ON "build_entries" ("vehicle_id", "entry_date" DESC);

-- Photos gain an optional link to a build entry. ON DELETE SET NULL means
-- deleting an entry keeps its photos in the vehicle gallery.
ALTER TABLE "photos"
  ADD COLUMN IF NOT EXISTS "build_entry_id" text
  REFERENCES "build_entries"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "photos_build_entry_idx"
  ON "photos" ("build_entry_id");
