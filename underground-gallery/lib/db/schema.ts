// lib/db/schema.ts
//
// Drizzle schema mirroring the live Underground Gallery database.
// This is the single source of truth that TypeScript queries against.
//
// Tables (in dependency order):
//   users                  — accounts + profile fields
//   accounts               — NextAuth provider links
//   sessions               — NextAuth sessions
//   verification_tokens    — NextAuth magic-link tokens
//   applications           — apply-form snapshots + approval state machine
//   moderation_events      — audit log of approve/reject decisions
//   vehicles               — one row per car, multiple per user
//   photos                 — polymorphic: belongs to user (avatar) or vehicle (gallery)
//   app_settings           — global k/v toggles for the admin dashboard

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
// id is text (not uuid) because gen_random_uuid() returns it cast as text.
// Includes everything from Stage 1A (auth+approval) and Stage 1B-iii (region
// + setup_completed_at) and Stage 2 (bio + avatar_photo_id).

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
    name: text('name'),
    image: text('image'),

    // Approval state machine
    status: text('status', { enum: ['pending', 'active', 'rejected'] })
      .notNull()
      .default('pending'),

    // Profile
    callsign: text('callsign'),
    region: text('region'),
    bio: text('bio'),
    // Avatar pointer — typed as `: AnyPgColumn` to break the circular reference
    // (users → photos.id and photos → users.id)
    avatarPhotoId: text('avatar_photo_id').references(
      (): AnyPgColumn => photos.id,
      { onDelete: 'set null' },
    ),

    // Region (Google Places)
    regionPlaceId: text('region_place_id'),
    regionLabel: text('region_label'),
    regionLat: doublePrecision('region_lat'),
    regionLng: doublePrecision('region_lng'),
    regionCountry: text('region_country'),
    regionAdmin1: text('region_admin1'),

    // Roles
    isModerator: boolean('is_moderator').notNull().default(false),

    // Timestamps
    appliedAt: timestamp('applied_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    approvedAt: timestamp('approved_at', { mode: 'date', withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { mode: 'date', withTimezone: true }),
    setupCompletedAt: timestamp('setup_completed_at', {
      mode: 'date',
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    callsignIdx: uniqueIndex('users_callsign_idx').on(t.callsign),
    statusIdx: index('users_status_idx').on(t.status),
  }),
);

// ─── accounts ─────────────────────────────────────────────────────────────

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

// ─── sessions ─────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

// ─── verification_tokens ──────────────────────────────────────────────────

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

// ─── applications ─────────────────────────────────────────────────────────
// Holds the apply-form snapshot AND the approval state. Status enum is
// enforced by a CHECK constraint in the DB; we mirror it here for type safety.

export const applications = pgTable(
  'applications',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Form snapshot
    callsign: text('callsign'),
    region: text('region'),
    drive: text('drive'),
    instagram: text('instagram'),
    invitedBy: text('invited_by'),
    message: text('message'),

    // Approval state machine
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .notNull()
      .default('pending'),
    submittedAt: timestamp('submitted_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    decidedAt: timestamp('decided_at', { mode: 'date', withTimezone: true }),
    decidedBy: text('decided_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    rejectReason: text('reject_reason'),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index('applications_user_id_idx').on(t.userId),
  }),
);

// ─── moderation_events ────────────────────────────────────────────────────
// Audit log: one row per moderator decision (approve | reject).

export const moderationEvents = pgTable('moderation_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: text('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action', { enum: ['approve', 'reject'] }).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── vehicles ─────────────────────────────────────────────────────────────
// One row per car. Build sections live here (per-vehicle, not per-user).

export const vehicles = pgTable(
  'vehicles',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    year: integer('year').notNull(),
    make: text('make').notNull(),
    model: text('model').notNull(),
    trim: text('trim'),
    notes: text('notes'),
    isPrimary: boolean('is_primary').notNull().default(false),

    // Hero photo for /v/[id] and member directory cards
    primaryPhotoId: text('primary_photo_id').references(
      (): AnyPgColumn => photos.id,
      { onDelete: 'set null' },
    ),

    // Build sections — free text, all optional
    buildExterior: text('build_exterior'),
    buildInterior: text('build_interior'),
    buildEngine: text('build_engine'),
    buildSuspension: text('build_suspension'),
    buildWheelsTires: text('build_wheels_tires'),

    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index('vehicles_user_id_idx').on(t.userId),
  }),
);

// ─── photos ───────────────────────────────────────────────────────────────
// Polymorphic photo store. (subject_type, subject_id) tells you whether a
// photo belongs to a user (their avatar) or a vehicle (a gallery image).

export const photos = pgTable(
  'photos',
  {
    id: text('id').primaryKey(),
    uploaderId: text('uploader_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type', { enum: ['user', 'vehicle'] }).notNull(),
    subjectId: text('subject_id').notNull(),

    urlFull: text('url_full').notNull(),
    urlThumb: text('url_thumb').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),

    // EXIF preserved for admin viewing only — public URLs strip it
    exifJson: jsonb('exif_json'),

    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    subjectIdx: index('photos_subject_idx').on(
      t.subjectType,
      t.subjectId,
      t.sortOrder,
    ),
    uploaderIdx: index('photos_uploader_idx').on(t.uploaderId),
  }),
);

// ─── app_settings ─────────────────────────────────────────────────────────
// Global k/v store for admin-toggleable settings.
// Seed values: require_profile_photo=false, require_vehicle_photos=false

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedBy: text('updated_by').references(() => users.id, {
    onDelete: 'set null',
  }),
});

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
