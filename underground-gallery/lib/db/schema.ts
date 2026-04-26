// ============================================================================
// PATCH: lib/db/schema.ts
// Add the inviteCodes Drizzle table. Drop this snippet anywhere alongside
// the other pgTable exports (e.g., right after `applications`).
// Make sure the imports at the top of schema.ts include: pgTable, text,
// timestamp, boolean, index, uniqueIndex (you already use these elsewhere).
// ============================================================================

export const inviteCodes = pgTable(
  "invite_codes",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    label: text("label"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    // The SQL migration uses LOWER(code) for case-insensitivity.
    // Drizzle's uniqueIndex below mirrors a plain unique index. The actual
    // case-insensitive uniqueness is enforced by the SQL migration's
    // CREATE UNIQUE INDEX ON LOWER(code). We add a plain index here so
    // queries by `code` are fast.
    codeIdx: index("invite_codes_code_lookup_idx").on(t.code),
    ownerIdx: index("invite_codes_owner_idx").on(t.ownerUserId),
    activeIdx: index("invite_codes_active_idx").on(t.isActive),
  }),
);
