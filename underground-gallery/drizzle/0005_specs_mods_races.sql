-- Stage 3: vehicle_specs, mod_catalog, user_car_mods, race_results
-- Plus extensions to existing `vehicles` table.
-- Idempotent — safe to rerun.

-- ── vehicle_specs ──────────────────────────────────────────────────────
-- Canonical stock-spec database. One row per (year, make, model, trim).
-- Filled organically as users add cars: when someone picks a trim we don't
-- have, they enter the stock specs once and we cache it for everyone.
CREATE TABLE IF NOT EXISTS "vehicle_specs" (
  "id"                 text PRIMARY KEY,
  "year"               integer NOT NULL,
  "make"               text NOT NULL,
  "model"              text NOT NULL,
  "trim"               text NOT NULL DEFAULT '',
  "body_style"         text,
  "engine"             text,
  "displacement"       text,                                    -- "3.0L" — string for flexibility
  "aspiration"         text,                                    -- 'NA' | 'Turbo' | 'Supercharged' | 'EV' | 'Hybrid'
  "fuel_type"          text,                                    -- 'Gasoline' | 'Diesel' | 'Electric' | etc.
  "transmission"       text,                                    -- 'Manual' | 'Auto' | 'DCT' | 'CVT'
  "drivetrain"         text,                                    -- 'AWD' | 'RWD' | 'FWD' | '4WD'
  "stock_hp"           integer,
  "stock_torque"       integer,                                 -- lb-ft
  "curb_weight"        integer,                                 -- lb
  "zero_to_sixty"      double precision,                        -- seconds
  "quarter_mile"       double precision,                        -- seconds
  "top_speed"          integer,                                 -- mph
  "source_provider"    text NOT NULL DEFAULT 'manual',          -- 'seed' | 'nhtsa' | 'carapi' | 'manual' | 'community'
  "source_confidence"  text NOT NULL DEFAULT 'unverified',      -- 'verified' | 'community' | 'estimated' | 'unverified'
  "raw_provider_json"  jsonb,
  "submitted_by"       text REFERENCES "users"("id") ON DELETE SET NULL,
  "verified_by"        text REFERENCES "users"("id") ON DELETE SET NULL,
  "verified_at"        timestamptz,
  "created_at"         timestamptz NOT NULL DEFAULT now(),
  "updated_at"         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "vehicle_specs_drivetrain_check"
    CHECK ("drivetrain" IS NULL OR "drivetrain" IN ('AWD', 'RWD', 'FWD', '4WD')),
  CONSTRAINT "vehicle_specs_transmission_check"
    CHECK ("transmission" IS NULL OR "transmission" IN ('Manual', 'Auto', 'DCT', 'CVT', 'Other')),
  CONSTRAINT "vehicle_specs_aspiration_check"
    CHECK ("aspiration" IS NULL OR "aspiration" IN ('NA', 'Turbo', 'Supercharged', 'TwinTurbo', 'EV', 'Hybrid', 'Other')),
  CONSTRAINT "vehicle_specs_confidence_check"
    CHECK ("source_confidence" IN ('verified', 'community', 'estimated', 'unverified')),
  CONSTRAINT "vehicle_specs_hp_positive"     CHECK ("stock_hp" IS NULL OR "stock_hp" >= 0),
  CONSTRAINT "vehicle_specs_torque_positive" CHECK ("stock_torque" IS NULL OR "stock_torque" >= 0),
  CONSTRAINT "vehicle_specs_weight_realistic" CHECK ("curb_weight" IS NULL OR "curb_weight" >= 500)
);

CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_specs_ymmt_idx"
  ON "vehicle_specs" (lower("make"), lower("model"), lower("trim"), "year");

CREATE INDEX IF NOT EXISTS "vehicle_specs_year_idx"
  ON "vehicle_specs" ("year");

CREATE INDEX IF NOT EXISTS "vehicle_specs_make_model_idx"
  ON "vehicle_specs" (lower("make"), lower("model"));


-- ── vehicles: extend existing table ────────────────────────────────────
-- Stage 2 already created vehicles. We add link to specs + mod overrides.
ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "vehicle_spec_id"      text REFERENCES "vehicle_specs"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "vin"                  text,
  ADD COLUMN IF NOT EXISTS "color"                text,
  ADD COLUMN IF NOT EXISTS "current_hp_override"      integer,
  ADD COLUMN IF NOT EXISTS "current_torque_override"  integer,
  ADD COLUMN IF NOT EXISTS "current_weight_override"  integer,
  ADD COLUMN IF NOT EXISTS "tire_type"             text,                  -- 'DragRadial' | 'Performance' | 'AllSeason' | 'Eco' | 'Unknown'
  ADD COLUMN IF NOT EXISTS "transmission_override"  text,
  ADD COLUMN IF NOT EXISTS "drivetrain_override"    text,
  ADD COLUMN IF NOT EXISTS "driver_skill"           integer DEFAULT 5;    -- 1-10, defaults to mid

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'vehicles_tire_type_check') THEN
    ALTER TABLE "vehicles"
      ADD CONSTRAINT "vehicles_tire_type_check"
      CHECK ("tire_type" IS NULL OR "tire_type" IN ('DragRadial', 'Performance', 'AllSeason', 'Eco', 'Unknown'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                 WHERE constraint_name = 'vehicles_driver_skill_check') THEN
    ALTER TABLE "vehicles"
      ADD CONSTRAINT "vehicles_driver_skill_check"
      CHECK ("driver_skill" IS NULL OR ("driver_skill" >= 1 AND "driver_skill" <= 10));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "vehicles_spec_idx" ON "vehicles" ("vehicle_spec_id");


-- ── mod_catalog ────────────────────────────────────────────────────────
-- Library of preset mods users can pick from. Seeded below.
CREATE TABLE IF NOT EXISTS "mod_catalog" (
  "id"                       text PRIMARY KEY,
  "category"                 text NOT NULL,
  "name"                     text NOT NULL,
  "description"              text,
  "default_hp_gain"          integer DEFAULT 0,
  "default_torque_gain"      integer DEFAULT 0,
  "default_weight_change"    integer DEFAULT 0,                  -- can be negative
  "traction_modifier"        double precision DEFAULT 0,
  "launch_modifier"          double precision DEFAULT 0,
  "shift_modifier"           double precision DEFAULT 0,
  "handling_modifier"        double precision DEFAULT 0,
  "reliability_modifier"     double precision DEFAULT 0,
  "display_order"            integer NOT NULL DEFAULT 0,
  "active"                   boolean NOT NULL DEFAULT true,
  "created_at"               timestamptz NOT NULL DEFAULT now(),
  "updated_at"               timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "mod_catalog_category_check"
    CHECK ("category" IN (
      'Tune', 'Turbo', 'Intake', 'Exhaust', 'Downpipes', 'Headers',
      'Fuel', 'Intercooler', 'Transmission', 'Tires', 'Suspension',
      'Brakes', 'WeightReduction', 'Aero', 'Drivetrain', 'Custom'
    ))
);

CREATE INDEX IF NOT EXISTS "mod_catalog_category_idx"
  ON "mod_catalog" ("category", "display_order");


-- ── user_car_mods ──────────────────────────────────────────────────────
-- Mods installed on a specific user vehicle. Either references a catalog
-- entry (preset) or stands alone (custom). Numeric fields can override the
-- catalog defaults if user has a dyno or knows specifics.
CREATE TABLE IF NOT EXISTS "user_car_mods" (
  "id"                       text PRIMARY KEY,
  "vehicle_id"               text NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "mod_catalog_id"           text REFERENCES "mod_catalog"("id") ON DELETE SET NULL,
  "custom_name"              text,                              -- used when no catalog reference
  "category"                 text NOT NULL,
  "hp_gain"                  integer DEFAULT 0,
  "torque_gain"              integer DEFAULT 0,
  "weight_change"            integer DEFAULT 0,
  "traction_modifier"        double precision DEFAULT 0,
  "launch_modifier"          double precision DEFAULT 0,
  "shift_modifier"           double precision DEFAULT 0,
  "handling_modifier"        double precision DEFAULT 0,
  "reliability_modifier"     double precision DEFAULT 0,
  "verified"                 boolean NOT NULL DEFAULT false,    -- dyno-verified, etc.
  "notes"                    text,
  "sort_order"               integer NOT NULL DEFAULT 0,
  "created_at"               timestamptz NOT NULL DEFAULT now(),
  "updated_at"               timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "user_car_mods_category_check"
    CHECK ("category" IN (
      'Tune', 'Turbo', 'Intake', 'Exhaust', 'Downpipes', 'Headers',
      'Fuel', 'Intercooler', 'Transmission', 'Tires', 'Suspension',
      'Brakes', 'WeightReduction', 'Aero', 'Drivetrain', 'Custom'
    ))
);

CREATE INDEX IF NOT EXISTS "user_car_mods_vehicle_idx"
  ON "user_car_mods" ("vehicle_id", "sort_order");


-- ── race_results ───────────────────────────────────────────────────────
-- Persisted race comparisons. Both cars + the calculation snapshot.
CREATE TABLE IF NOT EXISTS "race_results" (
  "id"                          text PRIMARY KEY,
  "challenger_user_id"          text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "challenger_vehicle_id"       text REFERENCES "vehicles"("id") ON DELETE SET NULL,
  "opponent_user_id"            text REFERENCES "users"("id") ON DELETE SET NULL,
  "opponent_vehicle_id"         text REFERENCES "vehicles"("id") ON DELETE SET NULL,
  "race_type"                   text NOT NULL,
  "challenger_score"            double precision NOT NULL,
  "opponent_score"              double precision NOT NULL,
  "challenger_estimated_et"     double precision,
  "opponent_estimated_et"       double precision,
  "challenger_trap_speed"       double precision,
  "opponent_trap_speed"         double precision,
  "winner_vehicle_id"           text REFERENCES "vehicles"("id") ON DELETE SET NULL,
  "estimated_gap"               double precision,                -- seconds, positive = winner ahead
  "summary"                     text,
  "calculation_json"            jsonb NOT NULL,                  -- snapshot of inputs/outputs
  "created_at"                  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT "race_results_type_check"
    CHECK ("race_type" IN ('zero_sixty', 'quarter_mile', 'half_mile', 'roll_40_140', 'highway_pull', 'dig', 'overall'))
);

CREATE INDEX IF NOT EXISTS "race_results_challenger_idx"
  ON "race_results" ("challenger_user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "race_results_opponent_idx"
  ON "race_results" ("opponent_user_id", "created_at" DESC);
