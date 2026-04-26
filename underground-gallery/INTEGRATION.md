# Underground Gallery — Stage 3 + 3.5 Integration

This package adds the **vehicle specs / mods / race calculator** system (Stage 3) and the **animated race + challenges + notifications + public race history** layer (Stage 3.5) to your existing Next.js app.

If you've already integrated Stage 1 + Stage 2 Part 1 + Stage 2 Part 2, this is the next drop-in.

---

## What's in this package

```
drizzle/
  0005_specs_mods_races.sql           — vehicle_specs, mod_catalog, user_car_mods, race_results, vehicles extensions
  0005_seed.sql                       — 40 popular vehicle specs + 25 mod presets
  0006_challenges_notifications.sql   — race_challenges, notifications, race_results extensions

lib/
  db/schema.ts                        — UPDATED with all new tables and types
  race/calculator.ts                  — pure race math (ETs, trap, drivetrain multipliers)
  race/build.ts                       — pure build calculator (stock + mods + overrides → final RaceCar)
  vehicle-data/                       — provider abstraction (cache → NHTSA → manual)
  validation/race.ts                  — zod schemas
  notifications/service.ts            — notify() + Resend email dispatch
  notifications/fetch.ts              — server-side fetcher for the bell
  pusher/server.ts                    — Pusher server SDK wrapper (race events)
  pusher/client.ts                    — Pusher browser client + subscribe helper

app/
  garage/actions.ts                   — server actions for vehicles + mods
  race/actions.ts                     — server actions for challenges + practice
  race/page.tsx                       — main /race UI
  race/challenge/[id]/page.tsx        — accept/decline/start a challenge
  race/result/[id]/page.tsx           — animated playback + result card (members)
  race/history/page.tsx               — public race log (filterable)
  r/[slug]/page.tsx                   — PUBLIC spectate page (no login required)
  api/og/race/[slug]/route.tsx        — dynamic 1200×630 OG image generator
  api/pusher/auth/route.ts            — Pusher private channel authorization
  api/vehicle-data/route.ts           — REST proxy for vehicle data lookups
  u/[callsign]/races/page.tsx         — per-user race log

components/
  AdminBadge.tsx                      — reusable admin pill (used everywhere a callsign appears)
  NotificationBell.tsx                — header dropdown with unread count
  garage/AddCarWizard.tsx             — 4-step add-vehicle wizard
  garage/SpecSheetCard.tsx            — stock vs current spec display
  garage/ModList.tsx                  — mod list + add-mod modal
  race/RaceAnimation.tsx              — light tree + ¼-mile simulation
  race/RaceResultCard.tsx             — final result card
  race/RaceUI.tsx                     — main /race interactive UI
  race/ChallengeInbox.tsx             — pending-challenges banner
  race/ChallengeView.tsx              — challenge detail + accept/decline/start
  race/ResultPageClient.tsx           — wraps animation + result + share controls
  race/SpectateClient.tsx             — public-facing replay (no login)

tests/
  race-calculator.test.ts             — 51 unit tests for the race math
```

---

## Step 1 — Apply the migrations

In Neon SQL Editor, in this order:

1. `drizzle/0005_specs_mods_races.sql`
2. `drizzle/0005_seed.sql` (40 vehicles + 25 mods)
3. `drizzle/0006_challenges_notifications.sql`
4. `drizzle/0007_public_spectate.sql`

All four are idempotent — safe to rerun.

## Step 2 — Drop in the files

The directory layout matches your repo. Copy everything into `underground-gallery/` and you're done. Files that already exist (`lib/db/schema.ts`) replace the old version; the new schema includes everything from prior stages plus the additions.

## Step 2.5 — Install Pusher

For the synced animation between both racers' screens:

```
npm install pusher pusher-js
```

Sign up at [pusher.com](https://pusher.com) (free tier — 100 concurrent connections, 200k messages/day, more than enough for v1). Create a new Channels app, pick a cluster (e.g. `us3`), and grab the four credentials.

## Step 3 — Environment variables

You should already have these from earlier stages:

- `DATABASE_URL`
- `AUTH_SECRET`
- `RESEND_API_KEY`
- `R2_*` (for photos)

Add these new ones:

- `NEXT_PUBLIC_APP_URL` — `https://undergroundgallery.ai` (used in email links)
- `RESEND_FROM_ADDRESS` — defaults to `Underground Gallery <noreply@undergroundgallery.ai>` if unset; override if you use a different sending address

**Pusher (for synced race animation):**

- `PUSHER_APP_ID` — server-side, secret
- `PUSHER_KEY` — server-side, can be public but kept here for the SDK
- `PUSHER_SECRET` — server-side, **keep secret**
- `PUSHER_CLUSTER` — server-side, e.g. `us3`
- `NEXT_PUBLIC_PUSHER_KEY` — same value as `PUSHER_KEY`, exposed to the browser
- `NEXT_PUBLIC_PUSHER_CLUSTER` — same value as `PUSHER_CLUSTER`, exposed to the browser

If Pusher env vars are missing, the app still works — challenges still run, results still save, but each viewer sees the animation independently with no countdown sync. Set them up and the synced experience activates automatically.

## Step 4 — Wire the notification bell into your header

Wherever you render your top nav (typically a `Header.tsx` or `app/layout.tsx`), import and render the bell. Example:

```tsx
import { getAuthContext } from '@/lib/auth/gates';
import { getRecentNotifications } from '@/lib/notifications/fetch';
import { NotificationBell } from '@/components/NotificationBell';

export async function Header() {
  const ctx = await getAuthContext();
  const notifs = ctx ? await getRecentNotifications(ctx.userId, 20) : [];
  return (
    <header>
      {/* … your existing nav … */}
      {ctx && <NotificationBell notifications={notifs} />}
    </header>
  );
}
```

## Step 5 — Wire admin badges (Jason's callsign: papi)

The `AdminBadge` and `CallsignWithBadge` components handle this. Search your existing pages (`/me`, `/u/[callsign]`, `/v/[id]`, `/members`, `/admin`) for places that render a callsign and swap them out:

```tsx
// Before
<span>@{user.callsign}</span>

// After
import { CallsignWithBadge } from '@/components/AdminBadge';
<CallsignWithBadge callsign={user.callsign} isAdmin={user.isModerator} size="md" />
```

The race/challenge/history pages already do this.

---

## Smoke test checklist

After deploying:

1. **Add a car via the wizard.** `/me` → "Add vehicle" → search for "BMW M4" → pick a trim → fill in your name/color → save.
2. **Add a mod.** Open the car → ModList → add an "ECU Tune" preset. Watch the SpecSheetCard show stock vs current.
3. **Practice race.** `/race` → pick your car → pick any community car → quarter mile → "RUN THE RACE". You should see a light tree and a side-by-side ¼-mile animation.
4. **Send a challenge.** `/race` → switch to "CHALLENGE A DRIVER" mode → pick an opponent → race type → message → "SEND CHALLENGE". You should land on `/race/challenge/[id]?sent=1`.
5. **Accept on a second account.** Log in as the opponent (test account), `/race` should show the inbox banner. Click → "ACCEPT CHALLENGE".
6. **Run the race together — verify sync.** Either party hits "▶ START THE RACE". Both should be redirected to `/race/result/[id]?animate=1&startAt=…` and see a `3 → 2 → 1` countdown that ends at the same instant on both phones. If you have a second device handy, do this side by side — the lights should drop simultaneously and the cars should be at the same position throughout. The bottom of the screen will say `● LIVE · BOTH SCREENS SYNCED` when sync is active.
7. **Verify emails.** Check both inboxes for: `challenge_received`, `challenge_accepted`, `race_completed` (×2).
8. **History page.** `/race/history` → filter by race type, by user. The race you just ran should be at the top.
9. **Profile race log.** `/u/papi/races` → see your wins/losses tally + race log.
10. **Notification bell.** Click the bell in the header — unread count should drop to zero on "MARK ALL READ".
11. **Public spectate page.** On the result page (logged in), the "● PUBLIC SPECTATE PAGE" section should show a `/r/[slug]` link. Open it in an incognito window — the public page should load without login. Test the share buttons: "COPY", X, WhatsApp, Facebook.
12. **OG image preview.** Paste your `/r/[slug]` link into iMessage, Twitter compose, Discord, Slack, or run it through [opengraph.xyz](https://www.opengraph.xyz/). You should see a 1200×630 card with both cars, callsigns, the gap, and "undergroundgallery.ai" branding. If it doesn't render, check `/api/og/race/[slug]` directly in your browser — it should return a PNG.
13. **Privacy toggle.** On the result page, click "MAKE PRIVATE" — refresh the public spectate URL in incognito. It should now 404. Toggle back to public, refresh — it returns.

---

## Public spectate pages — driving traffic to the site

Every challenge result automatically gets a public spectate page at:

```
https://undergroundgallery.ai/r/[6-char-slug]
```

That URL:
- **Is accessible without login.** Anyone with the link can watch the replay.
- **Has a polished OG image.** When pasted into iMessage / Twitter / WhatsApp / Discord / Slack, the link preview shows a 1200×630 card with both cars (using their primary photos as background), callsigns, the gap, and your branding. Generated by `/api/og/race/[slug]/route.tsx` using Next's built-in `ImageResponse`. No ffmpeg, no external service.
- **Has a "REQUEST INVITE" CTA.** Top-right and bottom of the page point non-members at `/`, so the gated landing page does the work of converting interested viewers.
- **Can be made private.** On the result page, either participant can flip "MAKE PRIVATE" to hide the spectate page (returns to 404). Practice runs are NEVER public — only `source = 'challenge'` results.

The 6-char slug uses a Crockford-style alphabet (no `il10o`) so it's easy to text or read aloud. ~30 million unique slugs available; collisions are not a real concern.

### Cache & performance
- Spectate pages are server-rendered with `revalidate = 60` so a viral link doesn't hammer your DB
- OG images cache at the CDN edge for `revalidate = 3600` (results are immutable, longer is fine)
- Both fall back gracefully if a slug doesn't exist — the OG endpoint returns a "Race not found" card instead of 404'ing the preview

---

## Adding a real spec source later (CarAPI, etc.)

The `lib/vehicle-data/` directory is a provider abstraction. To add CarAPI.app or similar:

1. Create `lib/vehicle-data/carapi.ts` implementing the `VehicleDataProvider` interface from `provider.ts`.
2. Update `lib/vehicle-data/index.ts` to chain it: `cache → carapi → nhtsa → manual`.
3. Whenever a CarAPI lookup succeeds, the cache layer automatically writes to `vehicle_specs` so subsequent users get instant DB hits.

Cost stays at $0 until you flip the CarAPI key.

---

The `lib/vehicle-data/` directory is a provider abstraction. To add CarAPI.app or similar:

1. Create `lib/vehicle-data/carapi.ts` implementing the `VehicleDataProvider` interface from `provider.ts`.
2. Update `lib/vehicle-data/index.ts` to chain it: `cache → carapi → nhtsa → manual`.
3. Whenever a CarAPI lookup succeeds, the cache layer automatically writes to `vehicle_specs` so subsequent users get instant DB hits.

Cost stays at $0 until you flip the CarAPI key.

---

## Known limitations / notes

- **Email failures are silent.** A failed Resend send logs to console but doesn't block the in-app notification. Check Vercel logs if a user reports missing emails.
- **Challenges expire after 7 days.** No background job clears them — `acceptChallenge` checks `expiresAt` on every call and marks them expired. For now that's enough.
- **Race sync requires Pusher.** If `PUSHER_*` env vars aren't set, both viewers still see the animation but each starts independently (no shared countdown). Set up the free tier to enable real-time sync.
- **Public pages use callsign + car info — no obfuscation.** Per the v1 design choice, spectators see full callsigns and full vehicle details. If a member is uncomfortable with a particular race being public, they can flip it private from the result page.
- **OG images are dynamic.** Each spectate page hits `/api/og/race/[slug]` once per minute (after edge cache expiry) to render the PNG. If you ever see weird preview behavior on a specific platform, hit `/api/og/race/[slug]` directly in your browser to inspect what's being returned.
- **No "rematch" button on the result page yet.** Easy add: on the result card, show "CHALLENGE @{opponent}" that prefills the challenge form.

---

## Typecheck status

This package was developed against an isolated tsconfig. All files pass `tsc --noEmit`.

51 unit tests pass on the race calculator (`npx vitest run tests/race-calculator.test.ts`).

---

## What's in memory for Jason

These are locked in across sessions:
- **Callsign**: `papi`
- **Founder/admin**: yes — admin badge always displays prominently
- **Email**: Outlook only
