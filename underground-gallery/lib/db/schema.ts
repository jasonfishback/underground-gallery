// lib/db/schema.ts
//
// Drizzle schema mirroring the live Underground Gallery database.
// Stage 3 update: adds vehicle_specs, mod_catalog, user_car_mods, race_results
// and extends `vehicles` with spec linkage + override fields.

import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  boolean,
  uniqueIndex,
  index,
  doublePrecision,
  jsonb,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

// ─── users ────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
    name: text('name'),
    image: text('image'),
    status: text('status', { enum: ['pending', 'active', 'rejected'] }).notNull().default('pending'),
    tier: text('tier', { enum: ['builder', 'crowd'] }).notNull().default('crowd'),
    callsign: text('callsign'),
    region: text('region'),
    bio: text('bio'),
    avatarPhotoId: text('avatar_photo_id').references((): AnyPgColumn => photos.id, { onDelete: 'set null' }),
    regionPlaceId: text('region_place_id'),
    regionLabel: text('region_label'),
    regionLat: doublePrecision('region_lat'),
    regionLng: doublePrecision('region_lng'),
    regionCountry: text('region_country'),
    regionAdmin1: text('region_admin1'),
    isModerator: boolean('is_moderator').notNull().default(false),
    appliedAt: timestamp('applied_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp('approved_at', { mode: 'date', withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { mode: 'date', withTimezone: true }),
    setupCompletedAt: timestamp('setup_completed_at', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    callsignIdx: uniqueIndex('users_callsign_idx').on(t.callsign),
    statusIdx: index('users_status_idx').on(t.status),
    tierIdx: index('users_tier_idx').on(t.tier),
  }),
);

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }),
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }),
);

export const applications = pgTable(
  'applications',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    callsign: text('callsign'),
    region: text('region'),
    drive: text('drive'),
    instagram: text('instagram'),
    invitedBy: text('invited_by'),
    message: text('message'),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
    submittedAt: timestamp('submitted_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp('decided_at', { mode: 'date', withTimezone: true }),
    decidedBy: text('decided_by').references(() => users.id, { onDelete: 'set null' }),
    rejectReason: text('reject_reason'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('applications_user_id_idx').on(t.userId),
    statusIdx: index('applications_status_idx').on(t.status, t.submittedAt),
  }),
);

export const moderationEvents = pgTable('moderation_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action', { enum: ['approve', 'reject'] }).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
});

// ─── vehicle_specs (NEW in Stage 3) ───────────────────────────────────────

export const vehicleSpecs = pgTable(
  'vehicle_specs',
  {
    id: text('id').primaryKey(),
    year: integer('year').notNull(),
    make: text('make').notNull(),
    model: text('model').notNull(),
    trim: text('trim').notNull().default(''),
    bodyStyle: text('body_style'),
    engine: text('engine'),
    displacement: text('displacement'),
    aspiration: text('aspiration', {
      enum: ['NA', 'Turbo', 'Supercharged', 'TwinTurbo', 'EV', 'Hybrid', 'Other'],
    }),
    fuelType: text('fuel_type'),
    transmission: text('transmission', {
      enum: ['Manual', 'Auto', 'DCT', 'CVT', 'Other'],
    }),
    drivetrain: text('drivetrain', { enum: ['AWD', 'RWD', 'FWD', '4WD'] }),
    stockHp: integer('stock_hp'),
    stockTorque: integer('stock_torque'),
    curbWeight: integer('curb_weight'),
    zeroToSixty: doublePrecision('zero_to_sixty'),
    quarterMile: doublePrecision('quarter_mile'),
    topSpeed: integer('top_speed'),
    sourceProvider: text('source_provider').notNull().default('manual'),
    sourceConfidence: text('source_confidence', {
      enum: ['verified', 'community', 'estimated', 'unverified'],
    }).notNull().default('unverified'),
    rawProviderJson: jsonb('raw_provider_json'),
    submittedBy: text('submitted_by').references(() => users.id, { onDelete: 'set null' }),
    verifiedBy: text('verified_by').references(() => users.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    yearIdx: index('vehicle_specs_year_idx').on(t.year),
  }),
);

// ─── vehicles (extended in Stage 3) ───────────────────────────────────────

export const vehicles = pgTable(
  'vehicles',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    make: text('make').notNull(),
    model: text('model').notNull(),
    trim: text('trim'),
    notes: text('notes'),
    isPrimary: boolean('is_primary').notNull().default(false),
    primaryPhotoId: text('primary_photo_id').references((): AnyPgColumn => photos.id, { onDelete: 'set null' }),
    buildExterior: text('build_exterior'),
    buildInterior: text('build_interior'),
    buildEngine: text('build_engine'),
    buildSuspension: text('build_suspension'),
    buildWheelsTires: text('build_wheels_tires'),

    // Stage 3 additions
    vehicleSpecId: text('vehicle_spec_id').references(() => vehicleSpecs.id, { onDelete: 'set null' }),
    vin: text('vin'),
    color: text('color'),
    currentHpOverride: integer('current_hp_override'),
    currentTorqueOverride: integer('current_torque_override'),
    currentWeightOverride: integer('current_weight_override'),
    tireType: text('tire_type', {
      enum: ['DragRadial', 'Performance', 'AllSeason', 'Eco', 'Unknown'],
    }),
    transmissionOverride: text('transmission_override'),
    drivetrainOverride: text('drivetrain_override'),
    driverSkill: integer('driver_skill').default(5),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('vehicles_user_id_idx').on(t.userId),
    specIdx: index('vehicles_spec_idx').on(t.vehicleSpecId),
  }),
);

export const photos = pgTable(
  'photos',
  {
    id: text('id').primaryKey(),
    uploaderId: text('uploader_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type', { enum: ['user', 'vehicle'] }).notNull(),
    subjectId: text('subject_id').notNull(),
    urlFull: text('url_full').notNull(),
    urlThumb: text('url_thumb').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    exifJson: jsonb('exif_json'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    subjectIdx: index('photos_subject_idx').on(t.subjectType, t.subjectId, t.sortOrder),
    uploaderIdx: index('photos_uploader_idx').on(t.uploaderId),
  }),
);

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
});

export const flags = pgTable(
  'flags',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type', { enum: ['photo', 'vehicle', 'user'] }).notNull(),
    subjectId: text('subject_id').notNull(),
    reason: text('reason', { enum: ['nsfw', 'fake', 'spam', 'harassment', 'other'] }).notNull(),
    details: text('details'),
    status: text('status', { enum: ['pending', 'resolved', 'dismissed'] }).notNull().default('pending'),
    resolvedAt: timestamp('resolved_at', { mode: 'date', withTimezone: true }),
    resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    resolution: text('resolution'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('flags_status_idx').on(t.status, t.createdAt),
    subjectIdx: index('flags_subject_idx').on(t.subjectType, t.subjectId),
    reporterIdx: index('flags_reporter_idx').on(t.reporterId),
  }),
);

export const votes = pgTable(
  'votes',
  {
    id: text('id').primaryKey(),
    voterId: text('voter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    voterVehicle: uniqueIndex('votes_unique_per_voter').on(t.voterId, t.vehicleId),
    vehicleIdx: index('votes_vehicle_idx').on(t.vehicleId),
  }),
);

// ─── mod_catalog (NEW) ────────────────────────────────────────────────────

export const modCatalog = pgTable(
  'mod_catalog',
  {
    id: text('id').primaryKey(),
    category: text('category', {
      enum: ['Tune', 'Turbo', 'Intake', 'Exhaust', 'Downpipes', 'Headers',
             'Fuel', 'Intercooler', 'Transmission', 'Tires', 'Suspension',
             'Brakes', 'WeightReduction', 'Aero', 'Drivetrain', 'Custom'],
    }).notNull(),
    name: text('name').notNull(),
    description: text('description'),
    defaultHpGain: integer('default_hp_gain').default(0),
    defaultTorqueGain: integer('default_torque_gain').default(0),
    defaultWeightChange: integer('default_weight_change').default(0),
    tractionModifier: doublePrecision('traction_modifier').default(0),
    launchModifier: doublePrecision('launch_modifier').default(0),
    shiftModifier: doublePrecision('shift_modifier').default(0),
    handlingModifier: doublePrecision('handling_modifier').default(0),
    reliabilityModifier: doublePrecision('reliability_modifier').default(0),
    displayOrder: integer('display_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    categoryIdx: index('mod_catalog_category_idx').on(t.category, t.displayOrder),
  }),
);

// ─── user_car_mods (NEW) ──────────────────────────────────────────────────

export const userCarMods = pgTable(
  'user_car_mods',
  {
    id: text('id').primaryKey(),
    vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
    modCatalogId: text('mod_catalog_id').references(() => modCatalog.id, { onDelete: 'set null' }),
    customName: text('custom_name'),
    category: text('category', {
      enum: ['Tune', 'Turbo', 'Intake', 'Exhaust', 'Downpipes', 'Headers',
             'Fuel', 'Intercooler', 'Transmission', 'Tires', 'Suspension',
             'Brakes', 'WeightReduction', 'Aero', 'Drivetrain', 'Custom'],
    }).notNull(),
    hpGain: integer('hp_gain').default(0),
    torqueGain: integer('torque_gain').default(0),
    weightChange: integer('weight_change').default(0),
    tractionModifier: doublePrecision('traction_modifier').default(0),
    launchModifier: doublePrecision('launch_modifier').default(0),
    shiftModifier: doublePrecision('shift_modifier').default(0),
    handlingModifier: doublePrecision('handling_modifier').default(0),
    reliabilityModifier: doublePrecision('reliability_modifier').default(0),
    verified: boolean('verified').notNull().default(false),
    notes: text('notes'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index('user_car_mods_vehicle_idx').on(t.vehicleId, t.sortOrder),
  }),
);

// ─── race_results (NEW) ───────────────────────────────────────────────────

export const raceResults = pgTable(
  'race_results',
  {
    id: text('id').primaryKey(),
    challengerUserId: text('challenger_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    challengerVehicleId: text('challenger_vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    opponentUserId: text('opponent_user_id').references(() => users.id, { onDelete: 'set null' }),
    opponentVehicleId: text('opponent_vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    raceType: text('race_type', {
      enum: ['zero_sixty', 'quarter_mile', 'half_mile', 'roll_40_140', 'highway_pull', 'dig', 'overall'],
    }).notNull(),
    challengerScore: doublePrecision('challenger_score').notNull(),
    opponentScore: doublePrecision('opponent_score').notNull(),
    challengerEstimatedEt: doublePrecision('challenger_estimated_et'),
    opponentEstimatedEt: doublePrecision('opponent_estimated_et'),
    challengerTrapSpeed: doublePrecision('challenger_trap_speed'),
    opponentTrapSpeed: doublePrecision('opponent_trap_speed'),
    winnerVehicleId: text('winner_vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    estimatedGap: doublePrecision('estimated_gap'),
    summary: text('summary'),
    calculationJson: jsonb('calculation_json').notNull(),
    // Stage 3.5 additions
    source: text('source', { enum: ['practice', 'challenge'] }).notNull().default('practice'),
    challengeId: text('challenge_id'), // FK to race_challenges enforced at DB level
    hiddenAt: timestamp('hidden_at', { mode: 'date', withTimezone: true }),
    // Stage 3.5b additions: public spectate pages
    isPublic: boolean('is_public').notNull().default(false),
    shareSlug: text('share_slug').unique(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    challengerIdx: index('race_results_challenger_idx').on(t.challengerUserId, t.createdAt),
    opponentIdx: index('race_results_opponent_idx').on(t.opponentUserId, t.createdAt),
  }),
);

// ─── race_challenges (NEW in Stage 3.5) ───────────────────────────────────

export const raceChallenges = pgTable(
  'race_challenges',
  {
    id: text('id').primaryKey(),
    challengerUserId: text('challenger_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    challengerVehicleId: text('challenger_vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
    opponentUserId: text('opponent_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    opponentVehicleId: text('opponent_vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
    raceType: text('race_type', {
      enum: ['zero_sixty', 'quarter_mile', 'half_mile', 'roll_40_140', 'highway_pull', 'dig', 'overall'],
    }).notNull(),
    message: text('message'),
    status: text('status', {
      enum: ['pending', 'accepted', 'declined', 'raced', 'expired'],
    }).notNull().default('pending'),
    raceResultId: text('race_result_id').references(() => raceResults.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { mode: 'date', withTimezone: true }),
    declinedAt: timestamp('declined_at', { mode: 'date', withTimezone: true }),
    racedAt: timestamp('raced_at', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    opponentPendingIdx: index('race_challenges_opponent_pending_idx')
      .on(t.opponentUserId, t.status, t.createdAt),
    challengerIdx: index('race_challenges_challenger_idx').on(t.challengerUserId, t.createdAt),
    statusIdx: index('race_challenges_status_idx').on(t.status, t.expiresAt),
  }),
);

// ─── notifications (NEW in Stage 3.5) ─────────────────────────────────────

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind', {
      enum: [
        'challenge_received',
        'challenge_accepted',
        'challenge_declined',
        'race_completed',
        'race_practice_run',
        'photo_flagged',
        'application_decision',
        'system',
      ],
    }).notNull(),
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'),
    readAt: timestamp('read_at', { mode: 'date', withTimezone: true }),
    emailSentAt: timestamp('email_sent_at', { mode: 'date', withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    unreadIdx: index('notifications_user_unread_idx').on(t.userId, t.readAt, t.createdAt),
  }),
);

// ─── Type exports ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type ModerationEvent = typeof moderationEvents.$inferSelect;
export type NewModerationEvent = typeof moderationEvents.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
export type Flag = typeof flags.$inferSelect;
export type NewFlag = typeof flags.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type VehicleSpec = typeof vehicleSpecs.$inferSelect;
export type NewVehicleSpec = typeof vehicleSpecs.$inferInsert;
export type ModCatalog = typeof modCatalog.$inferSelect;
export type NewModCatalog = typeof modCatalog.$inferInsert;
export type UserCarMod = typeof userCarMods.$inferSelect;
export type NewUserCarMod = typeof userCarMods.$inferInsert;
export type RaceResult = typeof raceResults.$inferSelect;
export type NewRaceResult = typeof raceResults.$inferInsert;
export type RaceChallenge = typeof raceChallenges.$inferSelect;
export type NewRaceChallenge = typeof raceChallenges.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
