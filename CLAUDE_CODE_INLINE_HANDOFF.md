# Underground Gallery — Stage 1B-iii + 1C Handoff (Inline)

You are picking up an in-progress build of **undergroundgallery.ai**. This document contains the full source for Stage 1B-iii (`/setup` page) and Stage 1C (moderator approval queue) inline below — no zip extraction needed. Your job: integrate it, then continue the build.

---

## Project context

- **Stack:** Next.js 15 (App Router) + Auth.js v5 (magic links via Resend) + Drizzle ORM + Neon Postgres + Vercel
- **Repo:** `github.com/jasonfishback/underground-gallery`
- **App lives in subfolder:** `underground-gallery/` (you should already be `cd`'d into this — confirm with `pwd`)
- **Vercel project ID:** `prj_E1Zv3KKi3udpxAoTqiarVwmgdF9o`
- **Vercel team ID:** `team_sSGerDPkWUnpnqV1oLzmIOtl`
- **Domain:** `undergroundgallery.ai` (Resend domain verified, magic links working end-to-end)
- **Sessions:** 90-day
- **Existing tables:** `users`, `accounts`, `sessions`, `verification_tokens`, `applications`

---

## What's already done

- Stage 1A: Database schema + Auth.js v5 + Resend magic links + Vercel deploy
- Stage 1B-i / 1B-ii: Auth flow working, sessions persisting

## What you're integrating now (full source below)

- **Stage 1B-iii: `/setup` page** — first-time-signin flow where new users pick:
  - **Callsign**: 3–20 chars, alphanumeric, must start with letter, profanity-filtered (`obscenity` lib), case-insensitive unique. **Set once, admin-only to change.**
  - **Region**: Google Places Autocomplete (New) — cities filter, session-tokened, **proxied through our API routes** (key stays server-side)
  - **Garage**: optional multi-vehicle list (year/make/model/trim/notes), add/remove

- **Stage 1C: Moderator approval queue**
  - Every new user lands in `pending` after `/setup`
  - Moderators designated via `MODERATOR_EMAILS` env (bootstrap) **OR** `users.is_moderator = true` (in-app promotion later)
  - Actions: approve / reject (rejection requires reason ≥3 chars, ≤500 chars, sent to user)
  - Resend emails on both transitions
  - Audit log in `moderation_events` table

## What's next after integration

- **Stage 1D**: Profile page where approved users can edit their garage. Callsign stays admin-only.
- **Then**: Admin tooling, rate-limit Places proxy routes, then Stage 2 (gallery functionality, TBD).

---

## Decisions Jason already made (don't re-litigate these)

- Callsign rules: strict (3–20 alphanumeric, must start with letter, profanity filter)
- Callsign change policy: **admin-only** after initial setup
- Region field: Google Places autocomplete (cities)
- Places API key: **proxied** through our API routes (server-side key)
- Garage at setup: **optional** (can finish setup with empty garage, add later)
- Approval flow: every new user goes to queue, no auto-approve
- Mod designation: env allowlist (`MODERATOR_EMAILS`) for bootstrap + `users.is_moderator` flag for in-app promotion later
- Mod actions: approve / reject only (no "request more info" or "ban" yet)
- User notifications: email on both approve and reject

## Use Outlook for any email tasks

Jason uses Outlook only — never suggest or offer Gmail alternatives.

---

## Integration plan

### 1. Confirm working directory

```bash
pwd
ls package.json next.config.* src/ 2>/dev/null
```

You should be in `<repo>/underground-gallery/` (the inner Next.js folder). If not, `cd` there.

### 2. Reconcile paths before creating files

The files below assume:
- `@/auth` → Auth.js v5 export (likely `src/auth.ts` or `auth.ts`)
- `@/db` → Drizzle client export
- `@/db/schema` → Drizzle schema, exporting `users`, `vehicles`, `applications`, `moderationEvents`
- Sign-in route is `/signin`

Check what Jason actually has:

```bash
ls src/auth.ts auth.ts 2>/dev/null
ls src/db/index.ts src/db.ts 2>/dev/null
cat src/db/schema.ts 2>/dev/null
cat src/middleware.ts 2>/dev/null
```

If any path differs, search-replace as you create the files. **If `src/middleware.ts` already exists, merge — don't overwrite.**

### 3. Schema merge (manual)

`src/db/schema.additions.ts` below is a **reference**, not a drop-in. The existing `src/db/schema.ts` already declares `users` and `applications`. You need to:
- **Add** new columns to the existing `users` definition (don't redeclare the table)
- **Add** the new `vehicles` and `moderationEvents` tables
- **Extend** the existing `applications` definition with the new state-machine columns
- After merging, you can delete `schema.additions.ts` (it's just a reference)

### 4. Install dependencies

```bash
npm install obscenity use-debounce zod
npm ls resend  # should already be installed
```

### 5. Apply migrations

Ask Jason whether he uses `drizzle-kit` or raw psql. For raw psql:

```bash
psql "$DATABASE_URL" -f drizzle/0001_setup_profile.sql
psql "$DATABASE_URL" -f drizzle/0002_approval_queue.sql
```

Both are idempotent (`IF NOT EXISTS` everywhere). For drizzle-kit users, generate proper migrations with `npx drizzle-kit generate` after merging the schema, then apply.

### 6. Add Vercel env vars

```bash
vercel env add GOOGLE_PLACES_API_KEY      # server-side only — NO NEXT_PUBLIC_ prefix
vercel env add MODERATOR_EMAILS           # comma-separated bootstrap mods
vercel env add EMAIL_FROM                 # e.g. "Underground Gallery <hello@undergroundgallery.ai>"
vercel env add NEXT_PUBLIC_SITE_URL       # https://undergroundgallery.ai
```

Then `vercel env pull .env.local` for local dev.

For `GOOGLE_PLACES_API_KEY`: Jason needs to create one in Google Cloud Console with **Places API (New)** enabled. Use "None" application restriction (server-side only) and "Places API (New)" API restriction.

### 7. Verify

```bash
npx tsc --noEmit
npx next lint
npm run dev
```

Smoke test in browser:
1. Sign in as a new user → should land on `/setup`
2. Try a callsign with leading digit ("7eleven") → must fail
3. Try a profane callsign → must fail
4. Submit valid setup → redirects to `/pending-approval`
5. Add yourself to `MODERATOR_EMAILS`, restart dev → `/mod/queue` shows your application
6. Approve it → email arrives, `/` accessible

### 8. Commit on a feature branch

```bash
git checkout -b stage-1b-iii-and-1c
git add .
git commit -m "Stage 1B-iii: /setup page + Stage 1C: mod approval queue"
git push -u origin stage-1b-iii-and-1c
```

Open a PR for Jason to review.

---

## Verified in prior session

- Full TypeScript typecheck passes against neon-http Drizzle client
- Validators: 7/7 callsign cases pass, 7/7 moderation action cases pass at runtime
- Profanity filter via `obscenity` English dataset catches leetspeak
- Callsign uniqueness race handled via partial unique index on `lower(callsign)` + friendly pre-check error before constraint fires
- Google Places: confirmed using `places.googleapis.com/v1/places:autocomplete` (New) with `includedPrimaryTypes: ["(cities)"]` and session tokens

---

# FILE CONTENTS

Create each of the following files at the indicated paths. All paths are relative to the inner `underground-gallery/` directory.


## `drizzle/0001_setup_profile.sql`

```sql
-- Stage 1B-iii: first-time-signin /setup
-- Adds profile fields to users + a vehicles table (garage)

-- Users: profile fields populated at /setup
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "callsign"           text UNIQUE,
  ADD COLUMN IF NOT EXISTS "region_place_id"    text,
  ADD COLUMN IF NOT EXISTS "region_label"       text,
  ADD COLUMN IF NOT EXISTS "region_lat"         double precision,
  ADD COLUMN IF NOT EXISTS "region_lng"         double precision,
  ADD COLUMN IF NOT EXISTS "region_country"     text,
  ADD COLUMN IF NOT EXISTS "region_admin1"      text,
  ADD COLUMN IF NOT EXISTS "setup_completed_at" timestamptz;

-- Case-insensitive uniqueness on callsign so "Ghost" and "ghost" can't both exist.
-- (Storage stays as the user typed it; we lower() in the index and on lookups.)
CREATE UNIQUE INDEX IF NOT EXISTS "users_callsign_lower_idx"
  ON "users" (lower("callsign"))
  WHERE "callsign" IS NOT NULL;

-- Vehicles (garage) — one row per car, multiple per user
CREATE TABLE IF NOT EXISTS "vehicles" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "year"       integer NOT NULL CHECK ("year" BETWEEN 1900 AND 2100),
  "make"       text    NOT NULL,
  "model"      text    NOT NULL,
  "trim"       text,
  "notes"      text,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "vehicles_user_id_idx" ON "vehicles" ("user_id");

-- Only one primary per user (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS "vehicles_one_primary_per_user_idx"
  ON "vehicles" ("user_id")
  WHERE "is_primary" = true;
```

## `drizzle/0002_approval_queue.sql`

```sql
-- Stage 1C: moderator approval queue
-- Layers approval state onto the existing `applications` table + adds is_moderator to users.

-- ── users: moderator flag ──────────────────────────────────────────
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "is_moderator" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "users_is_moderator_idx"
  ON "users" ("is_moderator")
  WHERE "is_moderator" = true;

-- ── applications: approval state machine ───────────────────────────
-- Status enum kept as text + check constraint for easy alteration later.
ALTER TABLE "applications"
  ADD COLUMN IF NOT EXISTS "user_id"        uuid REFERENCES "users"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "status"         text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "submitted_at"   timestamptz,
  ADD COLUMN IF NOT EXISTS "decided_at"     timestamptz,
  ADD COLUMN IF NOT EXISTS "decided_by"     uuid REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "reject_reason"  text,
  ADD COLUMN IF NOT EXISTS "created_at"     timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updated_at"     timestamptz NOT NULL DEFAULT now();

-- Constrain status values (drop-then-add so it's idempotent across reruns)
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_status_check";
ALTER TABLE "applications"
  ADD CONSTRAINT "applications_status_check"
  CHECK ("status" IN ('pending', 'approved', 'rejected'));

-- One application per user (the user's own onboarding submission)
CREATE UNIQUE INDEX IF NOT EXISTS "applications_user_id_unique"
  ON "applications" ("user_id")
  WHERE "user_id" IS NOT NULL;

-- Queue lookups: pending applications, oldest-first
CREATE INDEX IF NOT EXISTS "applications_status_submitted_idx"
  ON "applications" ("status", "submitted_at");

-- Audit log of moderator decisions (separate from applications so we keep
-- history even if a user is later re-reviewed or their app is reopened)
CREATE TABLE IF NOT EXISTS "moderation_events" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "application_id"  uuid NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
  "actor_id"        uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action"          text NOT NULL CHECK ("action" IN ('approve', 'reject')),
  "reason"          text,
  "created_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "moderation_events_application_idx"
  ON "moderation_events" ("application_id");
```

## `src/middleware.ts`

```ts
// src/middleware.ts
//
// Edge-runtime cookie check only. Real auth + role checks happen in the page
// Server Components (Auth.js v5 + Drizzle don't run in Edge).
//
// Guards:
//  - /setup            → must have a session cookie
//  - /mod              → must have a session cookie (role check at page level)
//  - /pending-approval → must have a session cookie

import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const PROTECTED_PREFIXES = ["/setup", "/mod", "/pending-approval"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const hasSession = SESSION_COOKIE_NAMES.some((name) => req.cookies.get(name));
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/setup/:path*", "/mod/:path*", "/pending-approval/:path*"],
};
```

## `src/db/schema.additions.ts`

```ts
// src/db/schema.ts — additions for Stage 1B-iii
// Merge the `users` columns into your existing users table definition.
// `vehicles` is a brand-new table.

import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  uuid,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── users (additions) ──────────────────────────────────────────────
// Add these columns to your existing `users` pgTable definition:
//
//   callsign:          text("callsign").unique(),
//   regionPlaceId:     text("region_place_id"),
//   regionLabel:       text("region_label"),
//   regionLat:         doublePrecision("region_lat"),
//   regionLng:         doublePrecision("region_lng"),
//   regionCountry:     text("region_country"),
//   regionAdmin1:      text("region_admin1"),
//   setupCompletedAt:  timestamp("setup_completed_at", { withTimezone: true }),
//
// (Don't redeclare the whole users table here — just paste those fields in.)

// ─── vehicles (new table) ───────────────────────────────────────────
import { users } from "./schema"; // adjust to wherever your users table lives

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    trim: text("trim"),
    notes: text("notes"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index("vehicles_user_id_idx").on(t.userId),
    onePrimaryPerUser: uniqueIndex("vehicles_one_primary_per_user_idx")
      .on(t.userId)
      .where(sql`${t.isPrimary} = true`),
  }),
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
```

## `src/lib/validation/setup.ts`

```ts
// src/lib/validation/setup.ts
import { z } from "zod";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

// ── Profanity matcher (singleton) ────────────────────────────────────
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function containsProfanity(input: string): boolean {
  return matcher.hasMatch(input);
}

// ── Callsign rules ───────────────────────────────────────────────────
// 3–20 chars, alphanumeric only, must not start with a digit, profanity filtered.
// Stored as the user typed it; uniqueness is case-insensitive at the DB layer.
export const callsignSchema = z
  .string()
  .trim()
  .min(3, "At least 3 characters")
  .max(20, "At most 20 characters")
  .regex(/^[A-Za-z][A-Za-z0-9]*$/, "Letters & numbers only, must start with a letter")
  .refine((v) => !containsProfanity(v), "Pick a different callsign");

// ── Region (from Google Places New) ──────────────────────────────────
export const regionSchema = z.object({
  placeId: z.string().min(1),
  label: z.string().min(1).max(200),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  country: z.string().min(2).max(3).optional(),  // ISO-3166-1 alpha-2
  admin1: z.string().max(100).optional(),         // state/province
});
export type RegionInput = z.infer<typeof regionSchema>;

// ── Vehicle ──────────────────────────────────────────────────────────
const currentYear = new Date().getFullYear();
export const vehicleSchema = z.object({
  year: z
    .number()
    .int()
    .min(1900, "Too old")
    .max(currentYear + 2, "Too far in the future"),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  trim: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

// ── Full setup payload (garage optional) ─────────────────────────────
export const setupPayloadSchema = z.object({
  callsign: callsignSchema,
  region: regionSchema,
  vehicles: z.array(vehicleSchema).max(20).default([]),
});
export type SetupPayload = z.infer<typeof setupPayloadSchema>;
```

## `src/lib/auth/require-setup.ts`

```ts
// src/lib/auth/require-setup.ts
//
// Drop at the top of any Server Component that requires a fully-onboarded
// AND approved user. There are three failure modes:
//
//   1. Not signed in           → /signin
//   2. Setup not complete      → /setup
//   3. Application not approved → /pending-approval (or /rejected)
//
// Approved users get { user, application } back.

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, applications } from "@/db/schema";

export async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      callsign: users.callsign,
      setupCompletedAt: users.setupCompletedAt,
      isModerator: users.isModerator,
      appStatus: applications.status,
      rejectReason: applications.rejectReason,
    })
    .from(users)
    .leftJoin(applications, eq(applications.userId, users.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  const me = rows[0];
  if (!me) redirect("/signin");

  if (!me.setupCompletedAt) redirect("/setup");

  if (me.appStatus !== "approved") {
    // Pending or rejected (or somehow null — treat as pending)
    redirect("/pending-approval");
  }

  return {
    user: {
      id: me.id,
      email: me.email,
      callsign: me.callsign,
      isModerator: me.isModerator,
    },
    session,
  };
}
```

## `src/lib/auth/moderator.ts`

```ts
// src/lib/auth/moderator.ts
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

/** Comma-separated emails in MODERATOR_EMAILS env are bootstrap moderators. */
function envAllowlist(): Set<string> {
  const raw = process.env.MODERATOR_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export type ModeratorContext = {
  userId: string;
  email: string;
  isModerator: true;
};

/**
 * Returns the moderator context if the current session belongs to a mod,
 * else null. A user is a mod if EITHER:
 *   - their email is in MODERATOR_EMAILS env, OR
 *   - users.is_moderator = true
 */
export async function getModerator(): Promise<ModeratorContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      isModerator: users.isModerator,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const me = rows[0];
  if (!me) return null;

  const email = (me.email ?? "").toLowerCase();
  const allowed = me.isModerator || (email && envAllowlist().has(email));

  if (!allowed) return null;
  return { userId: me.id, email, isModerator: true };
}

export async function requireModerator(): Promise<ModeratorContext> {
  const ctx = await getModerator();
  if (!ctx) {
    // Throw here; callers in pages should catch and redirect, or use the
    // page-level helper below.
    throw new Error("not_a_moderator");
  }
  return ctx;
}
```

## `src/lib/email/moderation.ts`

```ts
// src/lib/email/moderation.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Underground Gallery <hello@undergroundgallery.ai>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://undergroundgallery.ai";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendApprovalEmail(args: {
  to: string;
  callsign: string | null;
}): Promise<void> {
  const callsign = args.callsign ?? "driver";
  const subject = "You're in — Underground Gallery";
  const html = `
    <p>Welcome, ${escapeHtml(callsign)}.</p>
    <p>Your application has been approved. You now have full access.</p>
    <p><a href="${SITE_URL}">Sign in and pull up</a></p>
  `;
  const text = `Welcome, ${callsign}.

Your application has been approved. You now have full access.

${SITE_URL}`;

  try {
    await resend.emails.send({
      from: FROM,
      to: args.to,
      subject,
      html,
      text,
    });
  } catch (err) {
    // Don't fail the moderation action over an email blip — log and move on.
    console.error("[email] approval send failed", err);
  }
}

export async function sendRejectionEmail(args: {
  to: string;
  callsign: string | null;
  reason: string;
}): Promise<void> {
  const callsign = args.callsign ?? "there";
  const subject = "Underground Gallery application update";
  const html = `
    <p>Hi ${escapeHtml(callsign)},</p>
    <p>Thanks for applying to Underground Gallery. After review, we're unable to approve your application at this time.</p>
    <p><strong>Reason:</strong> ${escapeHtml(args.reason)}</p>
    <p>If you believe this was a mistake, reply to this email.</p>
  `;
  const text = `Hi ${callsign},

Thanks for applying to Underground Gallery. After review, we're unable to approve your application at this time.

Reason: ${args.reason}

If you believe this was a mistake, reply to this email.`;

  try {
    await resend.emails.send({
      from: FROM,
      to: args.to,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error("[email] rejection send failed", err);
  }
}
```

## `src/app/setup/page.tsx`

```tsx
// src/app/setup/page.tsx
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SetupForm } from "@/components/setup/SetupForm";

export const metadata = {
  title: "Set up your profile · Underground Gallery",
};

export default async function SetupPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/setup");
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      setupCompletedAt: users.setupCompletedAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const me = rows[0];
  if (!me) redirect("/signin");

  // Already onboarded — admins handle changes from here.
  if (me.setupCompletedAt) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Set up your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome to Underground Gallery. Pick a callsign, tell us where you run, and
          show us what you drive. Callsigns are permanent — choose carefully.
        </p>
      </div>
      <SetupForm signedInEmail={me.email ?? ""} />
    </main>
  );
}
```

## `src/app/setup/actions.ts`

```ts
// src/app/setup/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";           // adjust to your Auth.js v5 export
import { db } from "@/db";               // adjust to your Drizzle client
import { users } from "@/db/schema";     // adjust
import { vehicles } from "@/db/schema";  // adjust
import { applications } from "@/db/schema"; // adjust
import { setupPayloadSchema, type SetupPayload } from "@/lib/validation/setup";

export type CompleteSetupResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

export async function completeSetup(
  raw: SetupPayload,
): Promise<CompleteSetupResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not signed in" };
  }
  const userId = session.user.id;

  // Re-validate server-side. Never trust the client.
  const parsed = setupPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: issue?.path.join(".") ?? undefined,
    };
  }
  const data = parsed.data;

  // Block re-running setup if it's already complete (admins handle changes).
  const me = await db
    .select({
      id: users.id,
      setupCompletedAt: users.setupCompletedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (me.length === 0) {
    return { ok: false, error: "User not found" };
  }
  if (me[0].setupCompletedAt) {
    return { ok: false, error: "Setup already complete" };
  }

  // Final case-insensitive uniqueness check (race-safe via the partial unique
  // index, but we want a friendly message before hitting the constraint).
  const conflict = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.callsign}) = lower(${data.callsign})`)
    .limit(1);
  if (conflict.length > 0 && conflict[0].id !== userId) {
    return { ok: false, error: "Callsign already taken", field: "callsign" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          callsign: data.callsign,
          regionPlaceId: data.region.placeId,
          regionLabel: data.region.label,
          regionLat: data.region.lat,
          regionLng: data.region.lng,
          regionCountry: data.region.country ?? null,
          regionAdmin1: data.region.admin1 ?? null,
          setupCompletedAt: new Date(),
        })
        .where(eq(users.id, userId));

      if (data.vehicles.length > 0) {
        await tx.insert(vehicles).values(
          data.vehicles.map((v, i) => ({
            userId,
            year: v.year,
            make: v.make,
            model: v.model,
            trim: v.trim || null,
            notes: v.notes || null,
            isPrimary: i === 0, // first one becomes primary; user can change later
          })),
        );
      }

      // Create the pending application. onConflictDoNothing so re-running
      // setup (which is blocked above, but defense in depth) won't error.
      await tx
        .insert(applications)
        .values({
          userId,
          status: "pending",
          submittedAt: new Date(),
        })
        .onConflictDoNothing();
    });
  } catch (err) {
    // Most likely cause: callsign uniqueness race. Surface a clean message.
    console.error("[completeSetup] transaction failed", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("users_callsign_lower_idx")) {
      return { ok: false, error: "Callsign already taken", field: "callsign" };
    }
    return { ok: false, error: "Could not save your profile" };
  }

  revalidatePath("/", "layout");
  redirect("/pending-approval");
}
```

## `src/app/pending-approval/page.tsx`

```tsx
// src/app/pending-approval/page.tsx
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, applications } from "@/db/schema";

export const metadata = {
  title: "Application status · Underground Gallery",
};

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const rows = await db
    .select({
      callsign: users.callsign,
      setupCompletedAt: users.setupCompletedAt,
      status: applications.status,
      rejectReason: applications.rejectReason,
      submittedAt: applications.submittedAt,
    })
    .from(users)
    .leftJoin(applications, eq(applications.userId, users.id))
    .where(eq(users.id, session.user.id))
    .limit(1);

  const me = rows[0];
  if (!me) redirect("/signin");
  if (!me.setupCompletedAt) redirect("/setup");
  if (me.status === "approved") redirect("/");

  const isRejected = me.status === "rejected";

  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      {isRejected ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">
            Application not approved
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Hi {me.callsign ?? "there"} — we weren't able to approve your
            application this time.
          </p>
          {me.rejectReason && (
            <div className="mx-auto mt-4 max-w-md rounded-md border border-destructive/30 bg-destructive/5 p-4 text-left text-sm">
              <p className="font-medium">Reason</p>
              <p className="mt-1 text-muted-foreground">{me.rejectReason}</p>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            If you think this was a mistake, reply to the email we sent.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">
            Hold tight, {me.callsign ?? "driver"}.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your application is in the queue. A moderator will review it shortly
            — we'll email you when there's a decision.
          </p>
          {me.submittedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Submitted {new Date(me.submittedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </main>
  );
}
```

## `src/app/mod/queue/page.tsx`

```tsx
// src/app/mod/queue/page.tsx
import { redirect } from "next/navigation";
import { eq, asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, applications, vehicles } from "@/db/schema";
import { getModerator } from "@/lib/auth/moderator";
import { ApplicationRow } from "@/components/mod/ApplicationRow";

export const metadata = {
  title: "Approval queue · Underground Gallery",
};

// Don't cache — moderators need to see fresh state
export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const mod = await getModerator();
  if (!mod) redirect("/");

  // Load pending applications with their user
  const pending = await db
    .select({
      appId: applications.id,
      submittedAt: applications.submittedAt,
      userId: users.id,
      email: users.email,
      callsign: users.callsign,
      regionLabel: users.regionLabel,
      regionCountry: users.regionCountry,
      regionAdmin1: users.regionAdmin1,
    })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.userId))
    .where(eq(applications.status, "pending"))
    .orderBy(asc(applications.submittedAt));

  // Load vehicles for all pending users in one query
  const userIds = pending.map((p) => p.userId);
  const vehicleRows =
    userIds.length === 0
      ? []
      : await db
          .select()
          .from(vehicles)
          .where(inArray(vehicles.userId, userIds));

  const vehiclesByUser = new Map<string, typeof vehicleRows>();
  for (const v of vehicleRows) {
    const list = vehiclesByUser.get(v.userId) ?? [];
    list.push(v);
    vehiclesByUser.set(v.userId, list);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Approval queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending.length === 0
              ? "Inbox zero. Nice."
              : `${pending.length} application${pending.length === 1 ? "" : "s"} waiting for review.`}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Reviewing as <span className="font-medium">{mod.email}</span>
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No pending applications.
        </div>
      ) : (
        <ul className="space-y-4">
          {pending.map((p) => {
            // Sort vehicles: primary first, then by createdAt
            const userVehicles = (vehiclesByUser.get(p.userId) ?? [])
              .slice()
              .sort((a, b) => {
                if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
                return a.createdAt.getTime() - b.createdAt.getTime();
              });
            return (
              <li key={p.appId}>
                <ApplicationRow
                  applicationId={p.appId}
                  email={p.email ?? ""}
                  callsign={p.callsign ?? "(no callsign)"}
                  regionLabel={p.regionLabel ?? ""}
                  submittedAt={p.submittedAt?.toISOString() ?? null}
                  vehicles={userVehicles.map((v) => ({
                    year: v.year,
                    make: v.make,
                    model: v.model,
                    trim: v.trim,
                    notes: v.notes,
                    isPrimary: v.isPrimary,
                  }))}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
```

## `src/app/mod/queue/actions.ts`

```ts
// src/app/mod/queue/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  users,
  applications,
  moderationEvents,
} from "@/db/schema";
import { getModerator } from "@/lib/auth/moderator";
import {
  sendApprovalEmail,
  sendRejectionEmail,
} from "@/lib/email/moderation";

export type ModResult =
  | { ok: true }
  | { ok: false; error: string };

const approveInput = z.object({
  applicationId: z.string().uuid(),
});

const rejectInput = z.object({
  applicationId: z.string().uuid(),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason is too long"),
});

export async function approveApplication(
  raw: z.infer<typeof approveInput>,
): Promise<ModResult> {
  const mod = await getModerator();
  if (!mod) return { ok: false, error: "Not authorized" };

  const parsed = approveInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { applicationId } = parsed.data;

  // Load application + user email/callsign for the email send
  const rows = await db
    .select({
      appId: applications.id,
      status: applications.status,
      userId: applications.userId,
      email: users.email,
      callsign: users.callsign,
    })
    .from(applications)
    .leftJoin(users, eq(users.id, applications.userId))
    .where(eq(applications.id, applicationId))
    .limit(1);

  const app = rows[0];
  if (!app) return { ok: false, error: "Application not found" };
  if (app.status !== "pending") {
    return { ok: false, error: `Already ${app.status}` };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(applications)
        .set({
          status: "approved",
          decidedAt: new Date(),
          decidedBy: mod.userId,
          updatedAt: new Date(),
          rejectReason: null,
        })
        .where(eq(applications.id, applicationId));

      await tx.insert(moderationEvents).values({
        applicationId,
        actorId: mod.userId,
        action: "approve",
      });
    });
  } catch (err) {
    console.error("[approveApplication] tx failed", err);
    return { ok: false, error: "Could not approve" };
  }

  // Fire-and-forget email; logged inside the helper if it fails.
  if (app.email) {
    await sendApprovalEmail({ to: app.email, callsign: app.callsign });
  }

  revalidatePath("/mod/queue");
  return { ok: true };
}

export async function rejectApplication(
  raw: z.infer<typeof rejectInput>,
): Promise<ModResult> {
  const mod = await getModerator();
  if (!mod) return { ok: false, error: "Not authorized" };

  const parsed = rejectInput.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { applicationId, reason } = parsed.data;

  const rows = await db
    .select({
      appId: applications.id,
      status: applications.status,
      userId: applications.userId,
      email: users.email,
      callsign: users.callsign,
    })
    .from(applications)
    .leftJoin(users, eq(users.id, applications.userId))
    .where(eq(applications.id, applicationId))
    .limit(1);

  const app = rows[0];
  if (!app) return { ok: false, error: "Application not found" };
  if (app.status !== "pending") {
    return { ok: false, error: `Already ${app.status}` };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(applications)
        .set({
          status: "rejected",
          decidedAt: new Date(),
          decidedBy: mod.userId,
          rejectReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId));

      await tx.insert(moderationEvents).values({
        applicationId,
        actorId: mod.userId,
        action: "reject",
        reason,
      });
    });
  } catch (err) {
    console.error("[rejectApplication] tx failed", err);
    return { ok: false, error: "Could not reject" };
  }

  if (app.email) {
    await sendRejectionEmail({
      to: app.email,
      callsign: app.callsign,
      reason,
    });
  }

  revalidatePath("/mod/queue");
  return { ok: true };
}
```

## `src/app/api/setup/check-callsign/route.ts`

```ts
// src/app/api/setup/check-callsign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";          // adjust to your Auth.js v5 export
import { db } from "@/db";              // adjust to your Drizzle client
import { users } from "@/db/schema";    // adjust to your users table import
import { callsignSchema } from "@/lib/validation/setup";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { callsign?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const parsed = callsignSchema.safeParse(body.callsign);
  if (!parsed.success) {
    return NextResponse.json({
      available: false,
      reason: parsed.error.issues[0]?.message ?? "Invalid callsign",
    });
  }

  const wanted = parsed.data;

  // Case-insensitive lookup matching our partial unique index
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.callsign}) = lower(${wanted})`)
    .limit(1);

  if (existing.length > 0 && existing[0].id !== session.user.id) {
    return NextResponse.json({ available: false, reason: "Already taken" });
  }

  return NextResponse.json({ available: true });
}
```

## `src/app/api/places/autocomplete/route.ts`

```ts
// src/app/api/places/autocomplete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // adjust to your Auth.js v5 export

export const runtime = "nodejs";

const PLACES_URL = "https://places.googleapis.com/v1/places:autocomplete";

export async function POST(req: NextRequest) {
  // Setup is for signed-in users only — gate the proxy too so randos can't
  // burn our quota.
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "places_not_configured" }, { status: 500 });
  }

  let body: { input?: string; sessionToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const input = (body.input ?? "").trim();
  if (input.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const upstream = await fetch(PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      // Field mask keeps the response (and our parsing) small.
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: ["(cities)"],
      sessionToken: body.sessionToken,
      languageCode: "en",
    }),
    // Don't cache user-typed queries.
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.error("[places/autocomplete] upstream error", upstream.status, errText);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  const data = (await upstream.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId: string;
        text?: { text: string };
        structuredFormat?: {
          mainText?: { text: string };
          secondaryText?: { text: string };
        };
      };
    }>;
  };

  const suggestions = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      placeId: p.placeId,
      label: p.text?.text ?? "",
      mainText: p.structuredFormat?.mainText?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    }));

  return NextResponse.json({ suggestions });
}
```

## `src/app/api/places/details/route.ts`

```ts
// src/app/api/places/details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // adjust to your Auth.js v5 export

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "places_not_configured" }, { status: 500 });
  }

  let body: { placeId?: string; sessionToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const placeId = (body.placeId ?? "").trim();
  if (!placeId) {
    return NextResponse.json({ error: "missing_place_id" }, { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  if (body.sessionToken) url.searchParams.set("sessionToken", body.sessionToken);

  const upstream = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,location,addressComponents",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.error("[places/details] upstream error", upstream.status, errText);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  const data = (await upstream.json()) as {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
    addressComponents?: Array<{
      longText: string;
      shortText: string;
      types: string[];
    }>;
  };

  // Pull country (ISO-2) and admin1 (state/province) from address components.
  const country = data.addressComponents?.find((c) =>
    c.types.includes("country"),
  )?.shortText;
  const admin1 = data.addressComponents?.find((c) =>
    c.types.includes("administrative_area_level_1"),
  )?.shortText;

  return NextResponse.json({
    placeId: data.id,
    label: data.formattedAddress ?? data.displayName?.text ?? "",
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    country,
    admin1,
  });
}
```

## `src/components/setup/SetupForm.tsx`

```tsx
// src/components/setup/SetupForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import { completeSetup } from "@/app/setup/actions";
import { callsignSchema, type RegionInput } from "@/lib/validation/setup";
import { RegionPicker } from "./RegionPicker";
import {
  GarageEditor,
  draftToVehicle,
  emptyDraftVehicle,
} from "./GarageEditor";

type CallsignState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "unavailable"; reason: string };

export function SetupForm({ signedInEmail }: { signedInEmail: string }) {
  const [callsign, setCallsign] = useState("");
  const [callsignState, setCallsignState] = useState<CallsignState>({ kind: "idle" });
  const [region, setRegion] = useState<RegionInput | null>(null);
  const [vehicleDrafts, setVehicleDrafts] = useState(
    [] as ReturnType<typeof emptyDraftVehicle>[],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Debounced availability check — fires only when local validation passes
  const checkAvailability = useDebouncedCallback(async (value: string) => {
    const local = callsignSchema.safeParse(value);
    if (!local.success) {
      setCallsignState({
        kind: "unavailable",
        reason: local.error.issues[0]?.message ?? "Invalid callsign",
      });
      return;
    }
    try {
      const res = await fetch("/api/setup/check-callsign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callsign: value }),
      });
      const data = (await res.json()) as
        | { available: true }
        | { available: false; reason: string };
      if (data.available) {
        setCallsignState({ kind: "available" });
      } else {
        setCallsignState({ kind: "unavailable", reason: data.reason });
      }
    } catch {
      setCallsignState({ kind: "idle" }); // network blip — don't block submit
    }
  }, 350);

  function onCallsignChange(v: string) {
    setCallsign(v);
    if (v.length === 0) {
      setCallsignState({ kind: "idle" });
      return;
    }
    setCallsignState({ kind: "checking" });
    checkAvailability(v);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // Local validation
    const csCheck = callsignSchema.safeParse(callsign);
    if (!csCheck.success) {
      setSubmitError(csCheck.error.issues[0]?.message ?? "Invalid callsign");
      return;
    }
    if (!region) {
      setSubmitError("Pick a region from the dropdown");
      return;
    }
    if (callsignState.kind === "unavailable") {
      setSubmitError(callsignState.reason);
      return;
    }

    // Convert drafts → validated vehicles, dropping any that are blank/invalid
    const vehicles = vehicleDrafts
      .map(draftToVehicle)
      .filter((v): v is NonNullable<typeof v> => v !== null);

    // If user typed *something* in any draft but it didn't validate, warn them
    const hasIncompleteDraft = vehicleDrafts.some((d, i) => {
      const anyFilled = Object.values(d).some((s) => s.trim() !== "");
      return anyFilled && draftToVehicle(d) === null;
    });
    if (hasIncompleteDraft) {
      setSubmitError(
        "One of your vehicles is missing year, make, or model. Fill it in or remove it.",
      );
      return;
    }

    startTransition(async () => {
      const result = await completeSetup({
        callsign: csCheck.data,
        region,
        vehicles,
      });
      if (!result.ok) {
        setSubmitError(result.error);
      }
      // On success the action redirects, so no client-side nav here.
    });
  }

  const submitDisabled =
    pending ||
    callsign.length === 0 ||
    callsignState.kind === "checking" ||
    callsignState.kind === "unavailable" ||
    !region;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Callsign */}
      <section className="space-y-2">
        <label htmlFor="callsign" className="block text-sm font-medium">
          Callsign
        </label>
        <input
          id="callsign"
          name="callsign"
          type="text"
          autoComplete="off"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g. Ghost or Apex42"
          value={callsign}
          onChange={(e) => onCallsignChange(e.target.value)}
          maxLength={20}
        />
        <CallsignStatus state={callsignState} />
        <p className="text-xs text-muted-foreground">
          3–20 characters, letters & numbers only, must start with a letter. Permanent — only an admin can change it later.
        </p>
      </section>

      {/* Region */}
      <section>
        <RegionPicker value={region} onChange={setRegion} />
      </section>

      {/* Garage */}
      <section>
        <GarageEditor drafts={vehicleDrafts} onChange={setVehicleDrafts} />
      </section>

      {/* Account context */}
      {signedInEmail && (
        <p className="text-xs text-muted-foreground">
          Signed in as {signedInEmail}.
        </p>
      )}

      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitDisabled}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow disabled:opacity-50"
      >
        {pending ? "Saving…" : "Finish setup"}
      </button>
    </form>
  );
}

function CallsignStatus({ state }: { state: CallsignState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "checking") {
    return <p className="text-xs text-muted-foreground">Checking…</p>;
  }
  if (state.kind === "available") {
    return <p className="text-xs text-emerald-600">✓ Available</p>;
  }
  return <p className="text-xs text-destructive">{state.reason}</p>;
}
```

## `src/components/setup/RegionPicker.tsx`

```tsx
// src/components/setup/RegionPicker.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { RegionInput } from "@/lib/validation/setup";

type Suggestion = {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string;
};

// Per Google's billing model, a session token groups autocomplete keystrokes
// with the final Place Details call into a single billable session.
function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function RegionPicker({
  value,
  onChange,
}: {
  value: RegionInput | null;
  onChange: (v: RegionInput | null) => void;
}) {
  const inputId = useId();
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionTokenRef = useRef<string>(newSessionToken());
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchSuggestions = useDebouncedCallback(async (input: string) => {
    if (input.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/places/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          sessionToken: sessionTokenRef.current,
        }),
      });
      if (!res.ok) {
        setSuggestions([]);
      } else {
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }, 250);

  async function pick(s: Suggestion) {
    setOpen(false);
    setQuery(s.label);
    // Exchange placeId for full details (billed in same session)
    const res = await fetch("/api/places/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId: s.placeId,
        sessionToken: sessionTokenRef.current,
      }),
    });
    if (!res.ok) {
      onChange(null);
      return;
    }
    const data = await res.json();
    if (
      typeof data.lat === "number" &&
      typeof data.lng === "number" &&
      data.placeId &&
      data.label
    ) {
      onChange({
        placeId: data.placeId,
        label: data.label,
        lat: data.lat,
        lng: data.lng,
        country: data.country,
        admin1: data.admin1,
      });
      // Once the session resolves, mint a fresh token for the next search
      sessionTokenRef.current = newSessionToken();
    } else {
      onChange(null);
    }
  }

  return (
    <div className="space-y-2" ref={wrapRef}>
      <label htmlFor={inputId} className="block text-sm font-medium">
        Region
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Start typing your city…"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            // Typing invalidates any previously-picked region
            if (value) onChange(null);
            setLoading(true);
            fetchSuggestions(v);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => pick(s)}
                >
                  <div className="font-medium">{s.mainText || s.label}</div>
                  {s.secondaryText && (
                    <div className="text-xs text-muted-foreground">
                      {s.secondaryText}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {value ? (
        <p className="text-xs text-muted-foreground">
          ✓ {value.label}
        </p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Searching…</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Pick from the dropdown to confirm your region.
        </p>
      )}
    </div>
  );
}
```

## `src/components/setup/GarageEditor.tsx`

```tsx
// src/components/setup/GarageEditor.tsx
"use client";

import { useId } from "react";
import type { VehicleInput } from "@/lib/validation/setup";

type DraftVehicle = {
  year: string; // string while typing, parsed on submit
  make: string;
  model: string;
  trim: string;
  notes: string;
};

export function emptyDraftVehicle(): DraftVehicle {
  return { year: "", make: "", model: "", trim: "", notes: "" };
}

export function draftToVehicle(d: DraftVehicle): VehicleInput | null {
  const year = parseInt(d.year, 10);
  if (!Number.isFinite(year)) return null;
  if (!d.make.trim() || !d.model.trim()) return null;
  return {
    year,
    make: d.make.trim(),
    model: d.model.trim(),
    trim: d.trim.trim(),
    notes: d.notes.trim(),
  };
}

export function GarageEditor({
  drafts,
  onChange,
}: {
  drafts: DraftVehicle[];
  onChange: (next: DraftVehicle[]) => void;
}) {
  const baseId = useId();

  function update(i: number, patch: Partial<DraftVehicle>) {
    onChange(drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }
  function remove(i: number) {
    onChange(drafts.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...drafts, emptyDraftVehicle()]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="block text-sm font-medium">Garage</label>
        <span className="text-xs text-muted-foreground">Optional — add later if you'd rather</span>
      </div>

      {drafts.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No vehicles yet. Add one below, or skip and finish setup.
        </p>
      )}

      {drafts.map((d, i) => (
        <fieldset
          key={`${baseId}-${i}`}
          className="space-y-2 rounded-md border p-4"
        >
          <div className="flex items-center justify-between">
            <legend className="text-sm font-medium">
              Vehicle {i + 1}
              {i === 0 && drafts.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (primary)
                </span>
              )}
            </legend>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => remove(i)}
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Year"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={d.year}
              onChange={(e) => update(i, { year: e.target.value })}
            />
            <input
              type="text"
              placeholder="Make"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={d.make}
              onChange={(e) => update(i, { make: e.target.value })}
            />
            <input
              type="text"
              placeholder="Model"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={d.model}
              onChange={(e) => update(i, { model: e.target.value })}
            />
            <input
              type="text"
              placeholder="Trim (optional)"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={d.trim}
              onChange={(e) => update(i, { trim: e.target.value })}
            />
          </div>
          <textarea
            placeholder="Notes (mods, build, anything)"
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={d.notes}
            onChange={(e) => update(i, { notes: e.target.value })}
          />
        </fieldset>
      ))}

      <button
        type="button"
        onClick={add}
        className="rounded-md border border-dashed px-4 py-2 text-sm hover:bg-accent"
      >
        + Add a vehicle
      </button>
    </div>
  );
}
```

## `src/components/mod/ApplicationRow.tsx`

```tsx
// src/components/mod/ApplicationRow.tsx
"use client";

import { useState, useTransition } from "react";
import {
  approveApplication,
  rejectApplication,
} from "@/app/mod/queue/actions";

type Vehicle = {
  year: number;
  make: string;
  model: string;
  trim: string | null;
  notes: string | null;
  isPrimary: boolean;
};

export function ApplicationRow(props: {
  applicationId: string;
  email: string;
  callsign: string;
  regionLabel: string;
  submittedAt: string | null;
  vehicles: Vehicle[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<null | "approved" | "rejected">(null);

  function onApprove() {
    setError(null);
    startTransition(async () => {
      const r = await approveApplication({ applicationId: props.applicationId });
      if (r.ok) setDone("approved");
      else setError(r.error);
    });
  }

  function onReject() {
    setError(null);
    if (reason.trim().length < 3) {
      setError("Reason must be at least 3 characters");
      return;
    }
    startTransition(async () => {
      const r = await rejectApplication({
        applicationId: props.applicationId,
        reason: reason.trim(),
      });
      if (r.ok) setDone("rejected");
      else setError(r.error);
    });
  }

  if (done) {
    return (
      <article className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        {props.callsign} — {done}.
      </article>
    );
  }

  const submitted = props.submittedAt
    ? new Date(props.submittedAt).toLocaleString()
    : "—";

  return (
    <article className="rounded-md border p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{props.callsign}</h2>
          <p className="text-xs text-muted-foreground">
            {props.email}
            {props.regionLabel && <> · {props.regionLabel}</>}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Submitted {submitted}
        </span>
      </header>

      <section className="mt-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Garage ({props.vehicles.length})
        </h3>
        {props.vehicles.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            No vehicles listed.
          </p>
        ) : (
          <ul className="mt-1 space-y-1 text-sm">
            {props.vehicles.map((v, i) => (
              <li key={i}>
                <span className="font-medium">
                  {v.year} {v.make} {v.model}
                </span>
                {v.trim && <span className="text-muted-foreground"> {v.trim}</span>}
                {v.isPrimary && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (primary)
                  </span>
                )}
                {v.notes && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {v.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        {!rejecting && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={onApprove}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow disabled:opacity-50"
            >
              {pending ? "Approving…" : "Approve"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setRejecting(true)}
              className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {rejecting && (
          <div className="flex w-full flex-col gap-2">
            <label className="text-xs font-medium">Reason (sent to applicant)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. Couldn't verify the garage details — feel free to reapply with more info."
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={onReject}
                className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground shadow disabled:opacity-50"
              >
                {pending ? "Rejecting…" : "Confirm reject"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setRejecting(false);
                  setReason("");
                  setError(null);
                }}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </footer>
    </article>
  );
}
```


---

## After integration

Tell Jason:
> Stage 1B-iii and 1C are merged. Ready for Stage 1D — profile page where users edit their garage. Want me to start that, or something else first?

If he says yes to 1D, ask before writing code:
- Should users be able to mark a different vehicle as primary, or is the first-added always primary?
- Soft-delete vehicles (keep history) or hard delete?
- Per-vehicle photo upload now, or text-only for 1D?

