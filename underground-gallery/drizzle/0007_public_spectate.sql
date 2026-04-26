-- Stage 3.5b: public spectate pages.
-- Adds is_public flag to race_results and a slug for cleaner share URLs.
-- Idempotent — safe to rerun.

ALTER TABLE "race_results"
  ADD COLUMN IF NOT EXISTS "is_public" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "share_slug" text;

-- Backfill: every existing challenge result becomes public; practice stays private.
UPDATE "race_results"
SET "is_public" = true
WHERE "source" = 'challenge' AND "is_public" = false;

-- Generate share slugs for any race that doesn't have one yet.
-- Format: 6-char alphanumeric (lower) — easy to read aloud or text.
UPDATE "race_results"
SET "share_slug" = lower(substr(md5(random()::text || id), 1, 6))
WHERE "share_slug" IS NULL;

-- Make slug unique going forward
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'race_results_share_slug_unique') THEN
    ALTER TABLE "race_results"
      ADD CONSTRAINT "race_results_share_slug_unique" UNIQUE ("share_slug");
  END IF;
END $$;

-- Index for the spectate-page lookup
CREATE INDEX IF NOT EXISTS "race_results_public_slug_idx"
  ON "race_results" ("share_slug")
  WHERE "is_public" = true AND "hidden_at" IS NULL;
