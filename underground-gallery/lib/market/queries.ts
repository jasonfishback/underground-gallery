// lib/market/queries.ts
//
// Centralized read queries for the marketplace. Server components import
// from here so we don't repeat the same join logic across pages.

import { and, asc, desc, eq, gte, ilike, lte, or, sql, inArray, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  listings,
  listingMessages,
  listingOffers,
  listingWatches,
  photos,
  users,
  type Listing,
  type ListingType,
  type ListingCondition,
  type PartCategory,
} from '@/lib/db/schema';
import { browseFilterSchema, type BrowseFilters } from '@/lib/market/types';

// ── Cards (for browse / mine / saved) ───────────────────────────────────────

export type ListingCard = Pick<
  Listing,
  | 'id'
  | 'sellerId'
  | 'listingType'
  | 'title'
  | 'priceCents'
  | 'currency'
  | 'priceType'
  | 'condition'
  | 'status'
  | 'year'
  | 'make'
  | 'model'
  | 'trim'
  | 'mileage'
  | 'partCategory'
  | 'partBrand'
  | 'fitmentMake'
  | 'fitmentModel'
  | 'fitmentYearFrom'
  | 'fitmentYearTo'
  | 'locationLabel'
  | 'createdAt'
  | 'publishedAt'
  | 'expiresAt'
  | 'soldAt'
> & {
  primaryPhotoUrl: string | null;
  primaryPhotoThumb: string | null;
  sellerCallsign: string | null;
};

const cardSelect = {
  id: listings.id,
  sellerId: listings.sellerId,
  listingType: listings.listingType,
  title: listings.title,
  priceCents: listings.priceCents,
  currency: listings.currency,
  priceType: listings.priceType,
  condition: listings.condition,
  status: listings.status,
  year: listings.year,
  make: listings.make,
  model: listings.model,
  trim: listings.trim,
  mileage: listings.mileage,
  partCategory: listings.partCategory,
  partBrand: listings.partBrand,
  fitmentMake: listings.fitmentMake,
  fitmentModel: listings.fitmentModel,
  fitmentYearFrom: listings.fitmentYearFrom,
  fitmentYearTo: listings.fitmentYearTo,
  locationLabel: listings.locationLabel,
  createdAt: listings.createdAt,
  publishedAt: listings.publishedAt,
  expiresAt: listings.expiresAt,
  soldAt: listings.soldAt,
  primaryPhotoUrl: photos.urlFull,
  primaryPhotoThumb: photos.urlThumb,
  sellerCallsign: users.callsign,
} as const;

// ── Browse (active listings, public to members) ─────────────────────────────

export async function browseListings(rawFilters: Partial<BrowseFilters>): Promise<{
  rows: ListingCard[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const filters = browseFilterSchema.parse({
    ...rawFilters,
    page: rawFilters.page ?? 1,
    pageSize: rawFilters.pageSize ?? 24,
    sort: rawFilters.sort ?? 'newest',
  });

  const conditions = [eq(listings.status, 'active')];

  if (filters.type) conditions.push(eq(listings.listingType, filters.type));
  if (filters.q) {
    const like = `%${filters.q.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(listings.title, like),
        ilike(listings.description, like),
        ilike(listings.make, like),
        ilike(listings.model, like),
        ilike(listings.partBrand, like),
        ilike(listings.partNumber, like),
      )!,
    );
  }
  if (filters.category) conditions.push(eq(listings.partCategory, filters.category));
  if (filters.make) conditions.push(ilike(listings.make, filters.make));
  if (filters.model) conditions.push(ilike(listings.model, filters.model));
  if (filters.yearMin) conditions.push(gte(listings.year, filters.yearMin));
  if (filters.yearMax) conditions.push(lte(listings.year, filters.yearMax));
  if (filters.priceMin) conditions.push(gte(listings.priceCents, filters.priceMin * 100));
  if (filters.priceMax) conditions.push(lte(listings.priceCents, filters.priceMax * 100));
  if (filters.condition) conditions.push(eq(listings.condition, filters.condition));

  const where = and(...conditions);

  const orderBy = (() => {
    switch (filters.sort) {
      case 'price_asc':
        return asc(listings.priceCents);
      case 'price_desc':
        return desc(listings.priceCents);
      case 'oldest':
        return asc(listings.createdAt);
      case 'newest':
      default:
        return desc(listings.createdAt);
    }
  })();

  const offset = (filters.page - 1) * filters.pageSize;

  const [rows, totalRow] = await Promise.all([
    db
      .select(cardSelect)
      .from(listings)
      .leftJoin(photos, eq(photos.id, listings.primaryPhotoId))
      .leftJoin(users, eq(users.id, listings.sellerId))
      .where(where)
      .orderBy(orderBy)
      .limit(filters.pageSize)
      .offset(offset),
    db
      .select({ n: count() })
      .from(listings)
      .where(where)
      .then((r) => r[0]?.n ?? 0),
  ]);

  return {
    rows: rows as ListingCard[],
    total: Number(totalRow),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

// ── Listing detail ──────────────────────────────────────────────────────────

export type ListingDetail = Listing & {
  sellerCallsign: string | null;
  sellerImage: string | null;
  sellerRegion: string | null;
  primaryPhotoUrl: string | null;
  photoCount: number;
};

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const [row] = await db
    .select({
      listing: listings,
      sellerCallsign: users.callsign,
      sellerImage: users.image,
      sellerRegion: users.regionLabel,
      primaryPhotoUrl: photos.urlFull,
    })
    .from(listings)
    .leftJoin(users, eq(users.id, listings.sellerId))
    .leftJoin(photos, eq(photos.id, listings.primaryPhotoId))
    .where(eq(listings.id, id))
    .limit(1);

  if (!row) return null;

  const [photoCountRow] = await db
    .select({ n: count() })
    .from(photos)
    .where(and(eq(photos.subjectType, 'listing'), eq(photos.subjectId, id)));

  return {
    ...row.listing,
    sellerCallsign: row.sellerCallsign,
    sellerImage: row.sellerImage,
    sellerRegion: row.sellerRegion,
    primaryPhotoUrl: row.primaryPhotoUrl,
    photoCount: Number(photoCountRow?.n ?? 0),
  };
}

// All photos for a listing, ordered
export async function getListingPhotos(listingId: string) {
  return db
    .select({
      id: photos.id,
      urlFull: photos.urlFull,
      urlThumb: photos.urlThumb,
      width: photos.width,
      height: photos.height,
      sortOrder: photos.sortOrder,
    })
    .from(photos)
    .where(and(eq(photos.subjectType, 'listing'), eq(photos.subjectId, listingId)))
    .orderBy(asc(photos.sortOrder), asc(photos.createdAt));
}

// ── Seller dashboard ────────────────────────────────────────────────────────

export async function getMyListings(sellerId: string): Promise<ListingCard[]> {
  const rows = await db
    .select(cardSelect)
    .from(listings)
    .leftJoin(photos, eq(photos.id, listings.primaryPhotoId))
    .leftJoin(users, eq(users.id, listings.sellerId))
    .where(eq(listings.sellerId, sellerId))
    .orderBy(desc(listings.updatedAt));
  return rows as ListingCard[];
}

export async function countActiveListings(sellerId: string): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(listings)
    .where(and(eq(listings.sellerId, sellerId), eq(listings.status, 'active')));
  return Number(r?.n ?? 0);
}

// ── Watchlist ───────────────────────────────────────────────────────────────

export async function getWatchedListings(userId: string): Promise<ListingCard[]> {
  const rows = await db
    .select(cardSelect)
    .from(listingWatches)
    .innerJoin(listings, eq(listings.id, listingWatches.listingId))
    .leftJoin(photos, eq(photos.id, listings.primaryPhotoId))
    .leftJoin(users, eq(users.id, listings.sellerId))
    .where(eq(listingWatches.userId, userId))
    .orderBy(desc(listingWatches.createdAt));
  return rows as ListingCard[];
}

export async function isListingWatched(userId: string, listingId: string): Promise<boolean> {
  const [r] = await db
    .select({ id: listingWatches.id })
    .from(listingWatches)
    .where(and(eq(listingWatches.userId, userId), eq(listingWatches.listingId, listingId)))
    .limit(1);
  return !!r;
}

// ── Threads / messages ─────────────────────────────────────────────────────

export type ThreadSummary = {
  listingId: string;
  listingTitle: string;
  listingPhotoUrl: string | null;
  otherUserId: string;
  otherCallsign: string | null;
  lastMessageBody: string;
  lastMessageAt: Date;
  unreadCount: number;
  isSeller: boolean; // true when the current user owns the listing
};

/**
 * One row per (listing, other-user) conversation involving the given user.
 * Aggregated in JS — postgres aggregation is more accurate but messy with
 * the polymorphic from/to pair.
 */
export async function getThreadsForUser(userId: string): Promise<ThreadSummary[]> {
  const rows = await db
    .select({
      id: listingMessages.id,
      listingId: listingMessages.listingId,
      fromUserId: listingMessages.fromUserId,
      toUserId: listingMessages.toUserId,
      body: listingMessages.body,
      readAt: listingMessages.readAt,
      createdAt: listingMessages.createdAt,
      listingTitle: listings.title,
      listingSellerId: listings.sellerId,
      listingPhotoUrl: photos.urlThumb,
    })
    .from(listingMessages)
    .innerJoin(listings, eq(listings.id, listingMessages.listingId))
    .leftJoin(photos, eq(photos.id, listings.primaryPhotoId))
    .where(or(eq(listingMessages.fromUserId, userId), eq(listingMessages.toUserId, userId)))
    .orderBy(desc(listingMessages.createdAt));

  // Bucket by (listingId, otherUserId)
  const map = new Map<string, ThreadSummary>();
  for (const r of rows) {
    const otherId = r.fromUserId === userId ? r.toUserId : r.fromUserId;
    const key = `${r.listingId}:${otherId}`;
    let t = map.get(key);
    if (!t) {
      t = {
        listingId: r.listingId,
        listingTitle: r.listingTitle,
        listingPhotoUrl: r.listingPhotoUrl,
        otherUserId: otherId,
        otherCallsign: null,
        lastMessageBody: r.body,
        lastMessageAt: r.createdAt,
        unreadCount: 0,
        isSeller: r.listingSellerId === userId,
      };
      map.set(key, t);
    }
    if (r.toUserId === userId && !r.readAt) t.unreadCount++;
  }

  // Hydrate other users' callsigns
  const otherIds = Array.from(map.values()).map((t) => t.otherUserId);
  if (otherIds.length > 0) {
    const u = await db
      .select({ id: users.id, callsign: users.callsign })
      .from(users)
      .where(inArray(users.id, otherIds));
    const byId = new Map(u.map((x) => [x.id, x.callsign]));
    for (const t of map.values()) t.otherCallsign = byId.get(t.otherUserId) ?? null;
  }

  return Array.from(map.values()).sort(
    (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
  );
}

export async function getThreadMessages(
  userId: string,
  listingId: string,
  otherUserId: string,
) {
  return db
    .select()
    .from(listingMessages)
    .where(
      and(
        eq(listingMessages.listingId, listingId),
        or(
          and(eq(listingMessages.fromUserId, userId), eq(listingMessages.toUserId, otherUserId)),
          and(eq(listingMessages.fromUserId, otherUserId), eq(listingMessages.toUserId, userId)),
        ),
      ),
    )
    .orderBy(asc(listingMessages.createdAt));
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(listingMessages)
    .where(and(eq(listingMessages.toUserId, userId), sql`${listingMessages.readAt} IS NULL`));
  return Number(r?.n ?? 0);
}

// ── Offers ─────────────────────────────────────────────────────────────────

export async function getOffersForListing(listingId: string) {
  return db
    .select({
      offer: listingOffers,
      buyerCallsign: users.callsign,
    })
    .from(listingOffers)
    .leftJoin(users, eq(users.id, listingOffers.buyerId))
    .where(eq(listingOffers.listingId, listingId))
    .orderBy(desc(listingOffers.createdAt));
}

export async function getOffersFromBuyer(buyerId: string) {
  return db
    .select({
      offer: listingOffers,
      listingTitle: listings.title,
      listingStatus: listings.status,
    })
    .from(listingOffers)
    .innerJoin(listings, eq(listings.id, listingOffers.listingId))
    .where(eq(listingOffers.buyerId, buyerId))
    .orderBy(desc(listingOffers.createdAt));
}
