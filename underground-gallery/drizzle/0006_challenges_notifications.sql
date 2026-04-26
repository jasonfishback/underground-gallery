-- Stage 3.5: race challenges, notifications, public race history.
-- Extends the race system from migration 0005 with multi-user flows.
-- Idempotent — safe to rerun.

-- ── race_challenges ────────────────────────────────────────────────────
-- A challenge from one user to another. Lifecycle:
--   pending  → opponent has not yet acted
--   accepted → opponent accepted; either party can hit "start race"
--   declined → opponent declined; terminal state
--   raced    → race ran; race_result_id is populated
--   expired  → 7d passed without action; terminal state
CREATE TABLE IF NOT EXISTS "race_challenges" (
  "id"                    text PRIMARY KEY,
  "challenger_user_id"    text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "challenger_vehicle_id" text NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "opponent_user_id"      text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "opponent_vehicle_id"   text NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "race_type"             text NOT NULL,
  "message"               text,
  "status"                text NOT NULL DEFAULT 'pending',
  "race_result_id"        text REFERENCES "race_results"("id") ON DELETE SET NULL,
  "expires_at"            timestamptz NOT NULL,
  "accepted_at"           timestamptz,
  "declined_at"           timestamptz,
  "raced_at"              timestamptz,
  "created_at"            timestamptz NOT NULL DEFAULT now(),
  "updated_at"            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "race_challenges_status_check"
    CHECK ("status" IN ('pending', 'accepted', 'declined', 'raced', 'expired')),
  CONSTRAINT "race_challenges_type_check"
    CHECK ("race_type" IN ('zero_sixty', 'quarter_mile', 'half_mile', 'roll_40_140', 'highway_pull', 'dig', 'overall')),
  CONSTRAINT "race_challenges_no_self_challenge"
    CHECK ("challenger_user_id" <> "opponent_user_id")
);

CREATE INDEX IF NOT EXISTS "race_challenges_opponent_pending_idx"
  ON "race_challenges" ("opponent_user_id", "status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "race_challenges_challenger_idx"
  ON "race_challenges" ("challenger_user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "race_challenges_status_idx"
  ON "race_challenges" ("status", "expires_at");


-- ── notifications ──────────────────────────────────────────────────────
-- In-app notifications surface. Drives the bell + count.
-- email_sent_at is populated when Resend confirms delivery (best-effort).
CREATE TABLE IF NOT EXISTS "notifications" (
  "id"            text PRIMARY KEY,
  "user_id"       text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind"          text NOT NULL,
  "title"         text NOT NULL,
  "body"          text,
  "link"          text,
  "read_at"       timestamptz,
  "email_sent_at" timestamptz,
  "metadata"      jsonb,
  "created_at"    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "notifications_kind_check"
    CHECK ("kind" IN (
      'challenge_received', 'challenge_accepted', 'challenge_declined',
      'race_completed', 'race_practice_run',
      'photo_flagged', 'application_decision', 'system'
    ))
);

CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx"
  ON "notifications" ("user_id", "read_at", "created_at" DESC);


-- ── race_results: extend with public-history fields ────────────────────
-- The race_results table from 0005 already exists. We add:
--   - source: 'practice' | 'challenge' — distinguishes friendly tests
--     from real challenges. Practice results are also public unless
--     hidden, but the UI labels them.
--   - hidden_at: lets users hide a particular result from history
--   - challenge_id: backref to the challenge that produced this result
ALTER TABLE "race_results"
  ADD COLUMN IF NOT EXISTS "source"       text NOT NULL DEFAULT 'practice',
  ADD COLUMN IF NOT EXISTS "challenge_id" text REFERENCES "race_challenges"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "hidden_at"    timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'race_results_source_check') THEN
    ALTER TABLE "race_results"
      ADD CONSTRAINT "race_results_source_check"
      CHECK ("source" IN ('practice', 'challenge'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "race_results_public_history_idx"
  ON "race_results" ("created_at" DESC) WHERE "hidden_at" IS NULL;
