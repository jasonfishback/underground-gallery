// lib/db/schema.ts
// Database schema for Underground Gallery.
//
// This file defines every table the app uses. Drizzle reads this and:
//   1. Generates TypeScript types for queries (so `db.select().from(users)` is fully typed)
//   2. Generates the SQL `CREATE TABLE` statements for migrations
//
// Tables match NextAuth.js's expected schema for the standard `users`, `accounts`,
// `sessions`, and `verification_tokens` — with custom fields added on `users` for
// our moderator approval workflow (status, callsign, region, etc).
//
// `applications` is custom: it stores the apply-form answers (what you drive, why you,
// etc) tied to a user. We keep it separate so the core user record stays clean.

import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ─── users ────────────────────────────────────────────────────────────────
// One row per person. NextAuth requires id/email/emailVerified/name/image —
// we add UG-specific fields below. `status` is the moderator-approval state.

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    name: text('name'),
    image: text('image'),

    // UG-specific fields
    status: text('status', { enum: ['pending', 'active', 'rejected'] })
      .notNull()
      .default('pending'),
    callsign: text('callsign'),
    region: text('region'),
    isModerator: boolean('is_moderator').notNull().default(false),

    appliedAt: timestamp('applied_at', { mode: 'date' }).notNull().defaultNow(),
    approvedAt: timestamp('approved_at', { mode: 'date' }),
    rejectedAt: timestamp('rejected_at', { mode: 'date' }),

    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    callsignIdx: uniqueIndex('users_callsign_idx').on(t.callsign),
    statusIdx: index('users_status_idx').on(t.status),
  })
);

// ─── accounts ─────────────────────────────────────────────────────────────
// NextAuth: links a user to an external auth provider (email, oauth, etc).
// For magic-link email auth, we store one row with provider='email'.

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'email' | 'oauth' | 'oidc'
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
  })
);

// ─── sessions ─────────────────────────────────────────────────────────────
// NextAuth: one row per active browser session.

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// ─── verification_tokens ──────────────────────────────────────────────────
// NextAuth: one-time tokens for magic-link emails.
// When a user clicks the link in their email, NextAuth looks up the token here
// and (if valid) creates a session.

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(), // usually the email address
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  })
);

// ─── applications ─────────────────────────────────────────────────────────
// Stores the application answers (what you drive, why you, etc).
// One row per user (latest submission wins). Kept separate from `users` so
// the user record stays clean for the dozens of profile/build queries we'll
// run later — applications are mostly only read by moderators.

export const applications = pgTable(
  'applications',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    callsign: text('callsign'),
    region: text('region'),
    drive: text('drive'),
    instagram: text('instagram'),
    invitedBy: text('invited_by'),
    message: text('message'),

    submittedAt: timestamp('submitted_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index('applications_user_id_idx').on(t.userId),
  })
);

// ─── Type exports ─────────────────────────────────────────────────────────
// Convenience types for use across the app.

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
