-- ============================================================================
-- 0009_vehicle_name.sql
-- Adds an optional `name` (nickname) field to vehicles.
-- The AddCarWizard already had a "Name this car" input ("Daily", "Track Rat",
-- "Project E36") but there was no column to land it in, so it was being
-- silently dropped. This adds the column. Idempotent (IF NOT EXISTS).
--
-- Apply with:
--   psql "$DATABASE_URL" -f drizzle/0009_vehicle_name.sql
-- or via _migrate.bat in the repo root.
-- ============================================================================

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS name text;

-- Optional: short, friendly. Soft cap via app-layer validation, not DB.
-- Leaving NULL allowed so existing rows are valid without a backfill.
