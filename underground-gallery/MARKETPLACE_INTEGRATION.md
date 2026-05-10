# Underground Marketplace — Stage 4 Integration

A members-only classifieds module for cars and car parts. Contact-only (no payments). Drop-in addition to the existing Next.js 14 + Drizzle + Postgres + NextAuth app.

> Companion file to `MARKETPLACE_PLAN.md` (which describes the design). This file is the deploy + ops guide.

---

## Files added

```
drizzle/
  0010_marketplace.sql                  — listings, listing_messages,
                                          listing_offers, listing_watches;
                                          extends photos.subject_type +
                                          notifications.kind enums

lib/
  db/schema.ts                          — UPDATED: new tables and types
  market/types.ts                       — zod schemas, enums, formatters
  market/queries.ts                     — browse/detail/dashboard/threads
  market/notifications.ts               — listing_* notification helpers
  market/pusher.ts                      — listing thread channel helpers
  notifications/service.ts              — UPDATED: NotificationKind union

app/
  market/layout.tsx                     — members-only gate
  market/page.tsx                       — browse all
  market/cars/page.tsx                  — cars-only browse
  market/parts/page.tsx                 — parts-only browse
  market/[id]/page.tsx                  — detail
  market/[id]/edit/page.tsx             — owner edit + photos + lifecycle
  market/[id]/flag/page.tsx             — report a listing
  market/new/page.tsx                   — type picker
  market/new/car/page.tsx               — create car
  market/new/part/page.tsx              — create part
  market/mine/page.tsx                  — seller dashboard
  market/saved/page.tsx                 — watchlist
  market/offers/page.tsx                — buyer's outgoing offers
  market/messages/page.tsx              — thread inbox
  market/messages/[threadId]/page.tsx   — single thread (realtime)
  market/actions.ts                     — server actions
  admin/market/page.tsx                 — moderator queue
  admin/market/actions.ts               — moderator actions
  api/market/photos/upload/route.ts     — listing photo upload
  api/market/cron/expire/route.ts       — daily expire sweep
  api/market/cron/notify-expiring/route.ts — daily 3-day-warning ping
  api/pusher/listing-auth/route.ts      — Pusher channel auth for DMs
  api/og/listing/[id]/route.tsx         — 1200×630 OG image

components/
  SiteHeader.tsx                        — UPDATED: adds "MARKET" nav link
  market/MarketCard.tsx                 — listing tile (browse / mine / saved)
  market/MarketGrid.tsx                 — grid + pagination
  market/MarketFilters.tsx              — sidebar filters (URL-driven)
  market/MarketSearchBar.tsx            — search + tabs + "+ list"
  market/ListingGallery.tsx             — photo gallery on detail page
  market/CarListingForm.tsx             — create/edit car
  market/PartListingForm.tsx            — create/edit part
  market/GarageLinkPicker.tsx           — autofill from garage
  market/MarketPhotoUploader.tsx        — multi-photo uploader (drag-drop)
  market/ListingLifecyclePanel.tsx      — publish / mark sold / bump / remove
  market/ContactSheet.tsx               — message-seller form
  market/WatchButton.tsx                — favorite toggle (optimistic)
  market/OfferModal.tsx                 — buyer-side make-an-offer
  market/OfferList.tsx                  — seller + buyer offer lists
  market/ThreadView.tsx                 — realtime DM thread
  market/AdminFlagRow.tsx               — admin queue row (flag)
  market/AdminListingRow.tsx            — admin queue row (listing)

vercel.json                             — cron schedules

MARKETPLACE_PLAN.md                     — design doc (this is the spec)
MARKETPLACE_INTEGRATION.md              — this file
```

No existing files were deleted. The only edits to pre-existing files are:

- `lib/db/schema.ts` — added enum members (`'listing'` to `photos.subjectType`, `'listing'` to `flags.subjectType`, seven `listing_*` to `notifications.kind`); appended new table defs at the end.
- `lib/notifications/service.ts` — extended `NotificationKind` union.
- `components/SiteHeader.tsx` — one new `<NavLink>`.

---

## Required env vars

The marketplace module reuses every secret already used by the rest of the app, plus one optional new one:

| Var | Purpose | Required? |
|-----|---------|-----------|
| `DATABASE_URL` | Postgres connection (already required by app) | yes |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Existing photo pipeline — listings reuse it | yes |
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Server-side Pusher (existing) — used for realtime DMs | optional (DMs degrade to manual refresh if absent) |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | Client-side Pusher subscription | optional (same as above) |
| `RESEND_API_KEY`, `RESEND_FROM_ADDRESS` | Existing email pipeline — listing notifications email through it | optional |
| `CRON_SECRET` | NEW. Vercel sends `Authorization: Bearer <CRON_SECRET>` to scheduled routes. The two cron routes reject unauthorized callers. Set to a random string. | yes for prod cron |
| `NEXT_PUBLIC_APP_URL` | Already used by notification emails for absolute links | yes |

---

## Deploy steps

1. **Run the migration** against your Neon Postgres database:
   ```bash
   psql "$DATABASE_URL" -f drizzle/0010_marketplace.sql
   ```
   (Or use whatever migration runner you currently use — the file is idempotent, safe to rerun.)

2. **Set `CRON_SECRET`** in Vercel project settings → Environment Variables. Generate one with `openssl rand -hex 32`.

3. **Deploy.** No new packages — uses everything already in `package.json`.

4. **Verify cron registered.** After the first deploy, Vercel → Cron Jobs should list two: `/api/market/cron/expire` (daily 07:00 UTC) and `/api/market/cron/notify-expiring` (daily 07:30 UTC).

5. **Smoke test the photo upload** by listing something cheap. If the upload fails, check the R2 bucket vars and that the bucket allows public reads on the configured `R2_PUBLIC_URL`.

---

## Tunable constants

Edit `lib/market/types.ts`:

| Constant | Default | What it does |
|----------|---------|--------------|
| `MAX_ACTIVE_LISTINGS_PER_USER` | 5 | Cap on concurrent active listings per member |
| `MAX_PHOTOS_PER_LISTING` | 20 | Cap on photos per listing |
| `LISTING_DEFAULT_EXPIRY_DAYS` | 30 | How long a published listing stays active |
| `OFFER_DEFAULT_EXPIRY_DAYS` | 7 | How long an offer auto-expires after |

To turn these into runtime-configurable settings, store them under keys in `app_settings` (the existing kv-style table) and read them in `actions.ts`.

---

## Manual test checklist

Run through this once after deploy:

**Browse**
- `/market` shows tabs (All / Cars / Parts), search bar, filters, and a grid of cards
- `/market/cars` filters to cars, exposes make/model/year filters
- `/market/parts` filters to parts, exposes category filter
- Filters update the URL and persist on refresh
- Pagination works on listings > 24

**Create a car listing**
- `/market/new` → choose Car
- Form pre-fills from a garage vehicle if you have one
- Submit creates a draft and redirects to `/market/[id]/edit`
- Photos upload one at a time and show as a grid; first one is hero
- Publish (30 days) flips status to active

**Create a part listing**
- `/market/new` → choose Part
- Category required; fitment optional
- Same publish flow

**Detail page**
- `/market/[id]` shows hero + thumbnails, spec table, seller card, price
- Owner sees "Edit" + "View messages"; everyone else sees Contact / Save / Make offer
- Offers panel only visible to owner; accept/decline notifies the buyer
- View counter increments only for non-owner viewers
- Right-click → "Copy link" yields a shareable URL with a custom OG image (`/api/og/listing/[id]`)

**Messaging**
- DM button opens `/market/messages/<id>-<sellerId>` thread
- Sending a message shows up in the seller's inbox + sends a notification + email
- Realtime: with two browsers signed in as buyer + seller, sent messages appear instantly without refresh
- The seller can reply only to people who already DM'd them on this listing

**Watchlist**
- Star/unstar from the detail page; `/market/saved` shows them
- Selling a watched listing → watchers get a `listing_watched_sold` notification

**Offers**
- Make offer below asking from a buyer account
- Seller sees it in `#offers` on their detail page; accept or decline
- Buyer sees status update + notification in `/market/offers`

**Lifecycle**
- Mark sold from the edit-page panel → status flips, watchers notified
- Bump → expiresAt resets +30 days, bumpedAt updates
- Remove → 410-style hidden from browse; admin can restore from `/admin/market`

**Moderation**
- Submit a report from `/market/[id]/flag`
- Moderator sees it in `/admin/market` → resolve or dismiss
- "Remove listing" from there both removes the listing and resolves the flag

**Cron**
- Hit `/api/market/cron/expire` with `Authorization: Bearer $CRON_SECRET` → returns `{ ok: true, expiredCount }`
- 3-day warning route is idempotent (rerun within 6 days = no duplicate notifications)

---

## Known limitations / future work (parking lot)

- **No payments.** Intentional. Stripe goes in a separate `merch` module.
- **No VIN decoder.** We have `vehicleSpecs` for that — wire it into the car form in v1.1.
- **Search is `ILIKE`-based.** Fine for ~10k listings. Swap to `pg_trgm` or a hosted search if you grow past that.
- **No "saved searches" / new-match alerts.** Easy add via cron.
- **No bundling / multi-photo offers.** One offer per listing per buyer at a time.
- **Image processing is pass-through.** The vehicle pipeline strips EXIF + resizes; the listing path currently uploads as-is. If listing photos start blowing through R2 storage, port the `image-processor` step from the vehicle uploader.
- **Pusher fallback is "no realtime" not "polling".** The thread still works, you just have to refresh. If you want polling fallback, a 10-second `setInterval` calling `getThreadMessages` would do it.
- **Reverse-search by mod.** A nice "find listings selling parts you've installed" feature is a join away — `listings.partCategory = userCarMods.category` filtered by user.

---

## Rollback

The migration is additive only — no destructive `DROP` or `ALTER COLUMN ... TYPE` against pre-existing tables. To roll back the module without touching data:

1. Remove the `MARKET` nav link in `components/SiteHeader.tsx`.
2. Delete `app/market/`, `app/admin/market/`, `app/api/market/`, `app/api/og/listing/`, `app/api/pusher/listing-auth/`, `lib/market/`, `components/market/`.
3. Remove the marketplace-specific entries from `lib/db/schema.ts` and `lib/notifications/service.ts`.
4. Drop `vercel.json`'s cron entries (or remove the file if it has no other entries).

Data stays in the four new tables, ready to come back if you want it.
