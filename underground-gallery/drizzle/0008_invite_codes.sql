-- ============================================================================
-- 0008_invite_codes.sql
-- Adds invite_codes table. Each member can have one or more codes.
-- "applications.invitedBy" already exists (text) — we'll start populating it
-- with the inviter's user_id (was previously a free string).
-- ============================================================================

CREATE TABLE IF NOT EXISTS invite_codes (
  id            TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  label         TEXT,                            -- optional, owner-set ("Twitter", "Mark", etc.)
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS invite_codes_code_uniq ON invite_codes (LOWER(code));
CREATE INDEX        IF NOT EXISTS invite_codes_owner_idx ON invite_codes (owner_user_id);
CREATE INDEX        IF NOT EXISTS invite_codes_active_idx ON invite_codes (is_active) WHERE is_active = TRUE;

-- Help admin referral leaderboard queries
CREATE INDEX IF NOT EXISTS applications_invited_by_idx ON applications (invited_by);
