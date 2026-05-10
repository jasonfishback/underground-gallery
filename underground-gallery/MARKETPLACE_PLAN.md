# Underground Marketplace — v1 Plan

A members-only classifieds module for cars and car parts. Contact-only (no payments in v1). Drops directly into the existing app: same auth, same photos pipeline, same Pusher, same admin moderation patterns.

> Future phase 2: separate **merch** section (different module) where the platform sells goods through Stripe. Marketplace stays contact-only forever.

---

## What we're incorporating from open source

We are **not forking a whole repo**. We're borrowing patterns and selectively translating code from these MIT-licensed projects:

| Repo | What we take | What we ignore |
|------|--------------|----------------|
| [OneStopShop](https://github.com/jackblatch/OneStopShop) (Next.js 14 App Router + Drizzle ORM marketplace) | Drizzle listing schema shape, server-actions-for-mutations pattern, seller dashboard layout, parallel/intercepting routes for the listing detail modal | Stripe Connect (we are contact-only), product variants, the cart/checkout |
| [SixMarket](https://github.com/swapnil233/SixMarket) (Next.js classifieds) | Filter sidebar UX, category taxonomy, "make an offer" / watchlist UX, listing card layout | Old Next.js 12 pages router, MongoDB |
| [Bazaar](https://github.com/hendurhance/bazaar) (open ad auction marketplace) | Listing lifecycle (draft → active → sold → expired), reporting/flag flow | Auction/bidding logic, PHP/Laravel stack |
| [Relivator](https://github.com/blefnk/relivator-nextjs-template) (Next 15 + Drizzle + shadcn) | shadcn/ui patterns for forms and filters if we want to lift any | Heavy ecommerce surface, Polar payments |

Everything else we already own: NextAuth, S3+Sharp photo pipeline, Pusher channels for realtime DMs, the `notifications` table, `flags` moderation, member geo data for "near me".

---

## Scope (confirmed)

- ✅ Cars for sale **and** parts for sale (unified module)
- ✅ Contact-only — buyers and sellers DM in-app, no escrow or payment processing
- ✅ Any approved member can list (gates by existing `users.status === 'active'`)
- ✅ Browse + search + filters
- ✅ Multi-photo upload (reuse `PhotoUploader`)
- ✅ Member-to-member messaging via Pusher
- ✅ Saved/watchlist + offers

---

## Schema additions (`drizzle/0010_marketplace.sql`)

### Extend existing `photos.subjectType` enum
Add `'listing'` so the existing polymorphic photos table covers marketplace photos with no new infrastructure.

### Extend `notifications.kind` enum
Add: `listing_message`, `listing_offer_received`, `listing_offer_accepted`, `listing_offer_declined`, `listing_watched_sold`, `listing_expiring_soon`.

### New tables

**`listings`** — unified table for cars and parts
- `id` (text, primary key, nanoid)
- `sellerId` → users.id
- `listingType` enum: `'car' | 'part'`
- `title`, `description` (text)
- `priceCents` (integer), `currency` (default 'USD'), `priceType` enum: `'firm' | 'obo' | 'trade' | 'free'`
- `condition` enum: `'new' | 'like_new' | 'used' | 'for_parts' | 'project'`
- `status` enum: `'draft' | 'active' | 'sold' | 'expired' | 'removed'`
- `primaryPhotoId` → photos.id
- `viewCount`, `favoriteCount` (integers, denormalized for sort speed)
- Location (mirror users region cols): `locationLabel`, `locationLat`, `locationLng`, `locationCountry`, `locationAdmin1`
- Timestamps: `createdAt`, `updatedAt`, `publishedAt`, `expiresAt`, `soldAt`, `bumpedAt`

**Car-specific columns (nullable, only set when `listingType='car'`):**
- `garageVehicleId` → vehicles.id (optional — if seller is selling a car already in their garage, link it and inherit specs/photos/mods)
- `year`, `make`, `model`, `trim`, `bodyStyle` (denormalized so listings work for cars not in the seller's garage)
- `vin`, `mileage`, `color`, `transmission`, `drivetrain`, `titleStatus` enum (`clean | salvage | rebuilt | bonded | other`)
- `modsSummary` (text — short blurb if not garage-linked)

**Part-specific columns (nullable, only set when `listingType='part'`):**
- `partCategory` (reuse the existing `mod_catalog.category` enum: Tune/Turbo/Intake/Exhaust/Suspension/etc.)
- `partBrand`, `partNumber`, `oemNumber`
- `fitmentMake`, `fitmentModel`, `fitmentYearFrom`, `fitmentYearTo`, `fitmentTrim`, `fitmentNotes`
- `quantity` (integer, default 1)

Indexes: `(status, listingType, createdAt)`, `(sellerId, status)`, `(listingType, partCategory)`, `(listingType, make, model, year)`, `(status, expiresAt)` for the cron expiry sweep.

**`listing_messages`** — buyer-seller DMs
- `id`, `listingId` → listings.id, `fromUserId`, `toUserId`, `body` (text), `readAt`, `createdAt`
- Index `(listingId, createdAt)` and `(toUserId, readAt)`
- Pusher channel: `private-listing-${listingId}-${otherUserId}` per pair

**`listing_offers`** — sub-asking-price offers
- `id`, `listingId`, `buyerId`, `amountCents`, `message`, `status` enum (`pending | accepted | declined | withdrawn | expired`), `createdAt`, `respondedAt`, `expiresAt`

**`listing_watches`** — watchlist
- `id`, `userId`, `listingId`, `createdAt`
- Unique `(userId, listingId)`

---

## Routes

| Route | Purpose |
|-------|---------|
| `/market` | Browse landing — defaults to "all", tabs for Cars / Parts |
| `/market/cars` | Cars-only list with car filters (make/model/year/transmission/mileage range/price) |
| `/market/parts` | Parts-only list with part filters (category/fitment/brand/condition) |
| `/market/[id]` | Listing detail (gallery, seller card, contact, watch, offer) |
| `/market/new` | Picker → `/market/new/car` or `/market/new/part` |
| `/market/new/car` | Car listing form (option: link garage vehicle to autofill) |
| `/market/new/part` | Part listing form |
| `/market/[id]/edit` | Owner edit |
| `/market/mine` | Seller dashboard (drafts, active, sold, expired) |
| `/market/saved` | My watchlist |
| `/market/messages` | All DM threads (or threads view) |
| `/market/messages/[threadId]` | One thread |

Plus an admin route under `/admin/market` for the moderation queue.

---

## Components

- `MarketCard` — listing card (photo, title, price, location, condition badge)
- `MarketFilters` — sidebar/drawer with type-specific filters
- `MarketSearchBar` — keyword + sort dropdown
- `CarListingForm` / `PartListingForm` — create/edit
- `GarageLinkPicker` — autofill car listing from one of seller's garage vehicles
- `ListingGallery` — photo carousel reusing PhotoUploader/Photo viewer
- `SellerCard` — seller profile snippet (callsign, region, member since, other listings count)
- `ContactSheet` — opens DM thread (reuses Pusher pattern from race spectating)
- `OfferModal` — submit/accept/decline offers
- `WatchButton` — toggle watchlist with optimistic update

---

## Server actions (`app/market/actions.ts`)

`createListing`, `updateListing`, `publishDraft`, `markSold`, `bumpListing`, `removeListing`, `linkGarageVehicle`, `unlinkGarageVehicle`, `sendMessage`, `markThreadRead`, `makeOffer`, `respondToOffer`, `withdrawOffer`, `toggleWatch`, `flagListing`.

---

## API routes

- `app/api/market/upload/route.ts` — proxy to existing photo upload pipeline with `subjectType='listing'`
- `app/api/market/cron/expire/route.ts` — Vercel cron, sweeps `status='active' AND expiresAt < now()` → `expired`
- `app/api/market/cron/notify-expiring/route.ts` — DM-style notification 3 days before expiry

---

## Trust, safety, and abuse controls (must-have for v1)

These come straight from your existing patterns:
- **Approved-member-only listing**: gate `createListing` on `users.status === 'active'`
- **Rate limit**: max 5 active listings per member at v1 (configurable in `app_settings`)
- **Listing expiry**: default 30 days, bump button extends 30 more
- **Flag/report**: reuse `flags` with `subjectType='listing'`
- **Admin queue**: extend `app/admin/...` to include listings with action buttons (approve, remove, ban)
- **Anti-spam**: cooldown between messages from new accounts; no external links from accounts < 7 days old
- **PII guard**: warn on phone numbers / emails in listing description (encourage in-app DMs)

---

## Build order

1. **Migration** `drizzle/0010_marketplace.sql` (extend enums + new tables)
2. **Schema** update `lib/db/schema.ts` with new tables and types
3. **Types & helpers** `lib/market/types.ts`, `lib/market/queries.ts` (centralized queries with photo joins)
4. **Server actions** `app/market/actions.ts`
5. **Browse page** `/market` + filters + cards
6. **Listing detail** `/market/[id]`
7. **Create/edit forms** car and part
8. **Seller dashboard** `/market/mine`
9. **Messaging** Pusher integration + threads page
10. **Watchlist** `/market/saved`
11. **Offers** UI + actions
12. **Admin moderation** `/admin/market`
13. **Cron** expiry + reminders
14. **Header nav** add "Market" link
15. **OG image** for social sharing of listings (matches the existing `app/api/og/race/[slug]` pattern)

---

## Out of scope (v1, parking lot)

- Stripe payments → that goes in the separate **merch** module
- Auctions / bidding
- Shipping calculator
- VIN decoder integration (we already have `vehicleSpecs` — could borrow that for autofill in v2)
- Bulk-import for vendors
- Email digests of new matching listings (can ship in v1.1)

---

## Estimated size

- Migration + schema: ~150 LOC SQL + ~120 LOC TS
- Server actions: ~400 LOC
- Routes + components: ~2,500–3,500 LOC TS/TSX
- Total: a chunky weekend feature, not a one-shot edit. We'll ship it in stages.
