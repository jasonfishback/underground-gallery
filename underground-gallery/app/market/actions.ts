// app/market/actions.ts
//
// Server actions for the Underground Marketplace.
// Contact-only (no payments). Members-only (requires users.status='active').

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, sql } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  users,
  vehicles,
  photos,
  flags,
  listings,
  listingMessages,
  listingOffers,
  listingWatches,
} from '@/lib/db/schema';
import { requireSetupComplete, isAuthError } from '@/lib/auth/gates';
import {
  carListingFormSchema,
  partListingFormSchema,
  sendMessageSchema,
  makeOfferSchema,
  respondOfferSchema,
  LISTING_DEFAULT_EXPIRY_DAYS,
  OFFER_DEFAULT_EXPIRY_DAYS,
  MAX_ACTIVE_LISTINGS_PER_USER,
  MAX_PHOTOS_PER_LISTING,
  type CarListingFormInput,
  type PartListingFormInput,
} from '@/lib/market/types';
import {
  notifyListingMessage,
  notifyOfferReceived,
  notifyOfferAccepted,
  notifyOfferDeclined,
  notifyWatchedSold,
} from '@/lib/market/notifications';
import { publishListingMessage } from '@/lib/market/pusher';
import { countActiveListings } from '@/lib/market/queries';

const newId = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz', 12);

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

// ─── Helpers ──────────────────────────────────────────────────────────────

async function attachPhotosToListing(
  listingId: string,
  photoIds: string[],
  userId: string,
  primaryPhotoId?: string | null,
): Promise<{ primaryPhotoId: string | null }> {
  if (photoIds.length === 0) return { primaryPhotoId: null };

  // Verify each photo was uploaded by this user (and is unassigned or already
  // tagged to this listing). Photos uploaded via /api/market/upload are
  // initially saved with subjectType='listing' and subjectId='draft:<userId>'.
  const validPhotos = await db
    .select({ id: photos.id })
    .from(photos)
    .where(
      and(
        eq(photos.uploaderId, userId),
        eq(photos.subjectType, 'listing'),
      ),
    );
  const validIds = new Set(validPhotos.map((p) => p.id));
  const filtered = photoIds.filter((id) => validIds.has(id)).slice(0, MAX_PHOTOS_PER_LISTING);
  if (filtered.length === 0) return { primaryPhotoId: null };

  // Re-attach all of them to this listing with sortOrder by array index
  await Promise.all(
    filtered.map((photoId, idx) =>
      db
        .update(photos)
        .set({ subjectId: listingId, sortOrder: idx })
        .where(eq(photos.id, photoId)),
    ),
  );

  const chosenPrimary =
    primaryPhotoId && filtered.includes(primaryPhotoId) ? primaryPhotoId : filtered[0];
  return { primaryPhotoId: chosenPrimary };
}

// ─── Create listing (car) ─────────────────────────────────────────────────

export async function createCarListing(raw: unknown): Promise<Result<{ listingId: string }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = carListingFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data as CarListingFormInput;

  // Cap on concurrent active listings (drafts don't count)
  const active = await countActiveListings(ctx.userId);
  if (active >= MAX_ACTIVE_LISTINGS_PER_USER) {
    return {
      ok: false,
      error: `Limit reached: ${MAX_ACTIVE_LISTINGS_PER_USER} active listings per member`,
    };
  }

  // If linking a garage vehicle, verify it belongs to this user
  if (data.garageVehicleId) {
    const [v] = await db
      .select({ userId: vehicles.userId })
      .from(vehicles)
      .where(eq(vehicles.id, data.garageVehicleId))
      .limit(1);
    if (!v || v.userId !== ctx.userId) {
      return { ok: false, error: 'Linked garage vehicle is not yours' };
    }
  }

  // Pull seller location as a fallback if listing doesn't include one
  const [me] = await db
    .select({
      regionLabel: users.regionLabel,
      regionLat: users.regionLat,
      regionLng: users.regionLng,
      regionCountry: users.regionCountry,
      regionAdmin1: users.regionAdmin1,
    })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);

  const listingId = newId();
  await db.insert(listings).values({
    id: listingId,
    sellerId: ctx.userId,
    listingType: 'car',
    title: data.title,
    description: data.description ?? null,
    priceCents: data.priceType === 'free' ? 0 : data.priceCents ?? null,
    currency: 'USD',
    priceType: data.priceType,
    condition: data.condition,
    status: 'draft',
    locationLabel: data.locationLabel ?? me?.regionLabel ?? null,
    locationLat: data.locationLat ?? me?.regionLat ?? null,
    locationLng: data.locationLng ?? me?.regionLng ?? null,
    locationCountry: data.locationCountry ?? me?.regionCountry ?? null,
    locationAdmin1: data.locationAdmin1 ?? me?.regionAdmin1 ?? null,
    garageVehicleId: data.garageVehicleId ?? null,
    year: data.year,
    make: data.make,
    model: data.model,
    trim: data.trim ?? null,
    bodyStyle: data.bodyStyle ?? null,
    vin: data.vin ?? null,
    mileage: data.mileage ?? null,
    color: data.color ?? null,
    transmission: data.transmission ?? null,
    drivetrain: data.drivetrain ?? null,
    titleStatus: data.titleStatus ?? null,
    modsSummary: data.modsSummary ?? null,
  });

  const { primaryPhotoId } = await attachPhotosToListing(
    listingId,
    data.photoIds,
    ctx.userId,
    data.primaryPhotoId,
  );
  if (primaryPhotoId) {
    await db.update(listings).set({ primaryPhotoId }).where(eq(listings.id, listingId));
  }

  revalidatePath('/market');
  revalidatePath('/market/mine');
  return { ok: true, data: { listingId } };
}

// ─── Create listing (part) ────────────────────────────────────────────────

export async function createPartListing(raw: unknown): Promise<Result<{ listingId: string }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = partListingFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data as PartListingFormInput;

  const active = await countActiveListings(ctx.userId);
  if (active >= MAX_ACTIVE_LISTINGS_PER_USER) {
    return { ok: false, error: `Limit reached: ${MAX_ACTIVE_LISTINGS_PER_USER} active listings per member` };
  }

  const [me] = await db
    .select({
      regionLabel: users.regionLabel,
      regionLat: users.regionLat,
      regionLng: users.regionLng,
      regionCountry: users.regionCountry,
      regionAdmin1: users.regionAdmin1,
    })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);

  const listingId = newId();
  await db.insert(listings).values({
    id: listingId,
    sellerId: ctx.userId,
    listingType: 'part',
    title: data.title,
    description: data.description ?? null,
    priceCents: data.priceType === 'free' ? 0 : data.priceCents ?? null,
    currency: 'USD',
    priceType: data.priceType,
    condition: data.condition,
    status: 'draft',
    locationLabel: data.locationLabel ?? me?.regionLabel ?? null,
    locationLat: data.locationLat ?? me?.regionLat ?? null,
    locationLng: data.locationLng ?? me?.regionLng ?? null,
    locationCountry: data.locationCountry ?? me?.regionCountry ?? null,
    locationAdmin1: data.locationAdmin1 ?? me?.regionAdmin1 ?? null,
    partCategory: data.partCategory,
    partBrand: data.partBrand ?? null,
    partNumber: data.partNumber ?? null,
    oemNumber: data.oemNumber ?? null,
    fitmentMake: data.fitmentMake ?? null,
    fitmentModel: data.fitmentModel ?? null,
    fitmentYearFrom: data.fitmentYearFrom ?? null,
    fitmentYearTo: data.fitmentYearTo ?? null,
    fitmentTrim: data.fitmentTrim ?? null,
    fitmentNotes: data.fitmentNotes ?? null,
    quantity: data.quantity ?? 1,
  });

  const { primaryPhotoId } = await attachPhotosToListing(
    listingId,
    data.photoIds,
    ctx.userId,
    data.primaryPhotoId,
  );
  if (primaryPhotoId) {
    await db.update(listings).set({ primaryPhotoId }).where(eq(listings.id, listingId));
  }

  revalidatePath('/market');
  revalidatePath('/market/mine');
  return { ok: true, data: { listingId } };
}

// ─── Update listing (works for either type) ───────────────────────────────

export async function updateListing(
  listingId: string,
  raw: unknown,
): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [existing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!existing) return { ok: false, error: 'Listing not found' };
  if (existing.sellerId !== ctx.userId) return { ok: false, error: 'Not your listing' };
  if (existing.status === 'sold' || existing.status === 'removed') {
    return { ok: false, error: `Cannot edit a ${existing.status} listing` };
  }

  const parser = existing.listingType === 'car' ? carListingFormSchema : partListingFormSchema;
  const parsed = parser.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data as CarListingFormInput | PartListingFormInput;

  const baseUpdates: Record<string, unknown> = {
    title: data.title,
    description: data.description ?? null,
    priceCents: data.priceType === 'free' ? 0 : data.priceCents ?? null,
    priceType: data.priceType,
    condition: data.condition,
    locationLabel: data.locationLabel ?? null,
    locationLat: data.locationLat ?? null,
    locationLng: data.locationLng ?? null,
    locationCountry: data.locationCountry ?? null,
    locationAdmin1: data.locationAdmin1 ?? null,
    updatedAt: new Date(),
  };

  if (data.listingType === 'car') {
    Object.assign(baseUpdates, {
      garageVehicleId: data.garageVehicleId ?? null,
      year: data.year,
      make: data.make,
      model: data.model,
      trim: data.trim ?? null,
      bodyStyle: data.bodyStyle ?? null,
      vin: data.vin ?? null,
      mileage: data.mileage ?? null,
      color: data.color ?? null,
      transmission: data.transmission ?? null,
      drivetrain: data.drivetrain ?? null,
      titleStatus: data.titleStatus ?? null,
      modsSummary: data.modsSummary ?? null,
    });
  } else {
    Object.assign(baseUpdates, {
      partCategory: data.partCategory,
      partBrand: data.partBrand ?? null,
      partNumber: data.partNumber ?? null,
      oemNumber: data.oemNumber ?? null,
      fitmentMake: data.fitmentMake ?? null,
      fitmentModel: data.fitmentModel ?? null,
      fitmentYearFrom: data.fitmentYearFrom ?? null,
      fitmentYearTo: data.fitmentYearTo ?? null,
      fitmentTrim: data.fitmentTrim ?? null,
      fitmentNotes: data.fitmentNotes ?? null,
      quantity: data.quantity ?? 1,
    });
  }

  await db.update(listings).set(baseUpdates).where(eq(listings.id, listingId));

  // Re-attach photos if any new IDs were submitted
  if (data.photoIds && data.photoIds.length > 0) {
    const { primaryPhotoId } = await attachPhotosToListing(
      listingId,
      data.photoIds,
      ctx.userId,
      data.primaryPhotoId,
    );
    if (primaryPhotoId) {
      await db.update(listings).set({ primaryPhotoId }).where(eq(listings.id, listingId));
    }
  }

  revalidatePath('/market');
  revalidatePath(`/market/${listingId}`);
  revalidatePath('/market/mine');
  return { ok: true };
}

// ─── Lifecycle: publish, mark sold, bump, remove ─────────────────────────

export async function publishDraft(listingId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [l] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!l) return { ok: false, error: 'Listing not found' };
  if (l.sellerId !== ctx.userId) return { ok: false, error: 'Not your listing' };
  if (l.status !== 'draft') return { ok: false, error: `Already ${l.status}` };

  const active = await countActiveListings(ctx.userId);
  if (active >= MAX_ACTIVE_LISTINGS_PER_USER) {
    return { ok: false, error: `Limit reached: ${MAX_ACTIVE_LISTINGS_PER_USER} active listings` };
  }

  const now = new Date();
  await db
    .update(listings)
    .set({
      status: 'active',
      publishedAt: now,
      expiresAt: daysFromNow(LISTING_DEFAULT_EXPIRY_DAYS),
      bumpedAt: now,
      updatedAt: now,
    })
    .where(eq(listings.id, listingId));

  revalidatePath('/market');
  revalidatePath(`/market/${listingId}`);
  revalidatePath('/market/mine');
  return { ok: true };
}

export async function markSold(listingId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [l] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!l) return { ok: false, error: 'Listing not found' };
  if (l.sellerId !== ctx.userId) return { ok: false, error: 'Not your listing' };
  if (l.status === 'sold' || l.status === 'removed') return { ok: false, error: `Already ${l.status}` };

  await db
    .update(listings)
    .set({ status: 'sold', soldAt: new Date(), updatedAt: new Date() })
    .where(eq(listings.id, listingId));

  // Notify watchers
  const watchers = await db
    .select({ userId: listingWatches.userId })
    .from(listingWatches)
    .where(eq(listingWatches.listingId, listingId));
  await Promise.all(
    watchers.map((w) =>
      notifyWatchedSold({ watcherId: w.userId, listingTitle: l.title, listingId }),
    ),
  );

  revalidatePath('/market');
  revalidatePath(`/market/${listingId}`);
  revalidatePath('/market/mine');
  return { ok: true };
}

export async function bumpListing(listingId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [l] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!l) return { ok: false, error: 'Listing not found' };
  if (l.sellerId !== ctx.userId) return { ok: false, error: 'Not your listing' };
  if (l.status !== 'active') return { ok: false, error: `Cannot bump a ${l.status} listing` };

  const now = new Date();
  await db
    .update(listings)
    .set({
      bumpedAt: now,
      expiresAt: daysFromNow(LISTING_DEFAULT_EXPIRY_DAYS),
      updatedAt: now,
    })
    .where(eq(listings.id, listingId));

  revalidatePath('/market');
  revalidatePath('/market/mine');
  return { ok: true };
}

export async function removeListing(listingId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [l] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!l) return { ok: false, error: 'Listing not found' };
  if (l.sellerId !== ctx.userId && !ctx.isModerator) return { ok: false, error: 'Not your listing' };

  await db
    .update(listings)
    .set({ status: 'removed', removedAt: new Date(), updatedAt: new Date() })
    .where(eq(listings.id, listingId));

  revalidatePath('/market');
  revalidatePath(`/market/${listingId}`);
  revalidatePath('/market/mine');
  return { ok: true };
}

// ─── Messaging ────────────────────────────────────────────────────────────

export async function sendMessage(raw: unknown): Promise<Result<{ messageId: string }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = sendMessageSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  if (parsed.data.toUserId === ctx.userId) {
    return { ok: false, error: "You can't message yourself" };
  }

  // Verify listing exists and isn't removed
  const [l] = await db
    .select({ id: listings.id, sellerId: listings.sellerId, title: listings.title, status: listings.status })
    .from(listings)
    .where(eq(listings.id, parsed.data.listingId))
    .limit(1);
  if (!l) return { ok: false, error: 'Listing not found' };
  if (l.status === 'removed') return { ok: false, error: 'Listing removed' };

  // The recipient must be either the seller (if I'm a buyer) or a buyer
  // who already messaged me (if I'm the seller). For v1, simplest rule:
  // if I'm the seller, I can reply to anyone who has DM'd me; otherwise I
  // can only DM the seller.
  if (ctx.userId !== l.sellerId && parsed.data.toUserId !== l.sellerId) {
    return { ok: false, error: 'Only the seller can be contacted on this listing' };
  }
  if (ctx.userId === l.sellerId) {
    // Seller must be replying to a known buyer (someone who already DM'd)
    const [prior] = await db
      .select({ id: listingMessages.id })
      .from(listingMessages)
      .where(
        and(
          eq(listingMessages.listingId, l.id),
          eq(listingMessages.fromUserId, parsed.data.toUserId),
          eq(listingMessages.toUserId, ctx.userId),
        ),
      )
      .limit(1);
    if (!prior) return { ok: false, error: 'No prior message from that user' };
  }

  const messageId = newId();
  await db.insert(listingMessages).values({
    id: messageId,
    listingId: parsed.data.listingId,
    fromUserId: ctx.userId,
    toUserId: parsed.data.toUserId,
    body: parsed.data.body,
  });

  // Realtime ping + notification
  const [me] = await db
    .select({ callsign: users.callsign })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);
  await Promise.all([
    publishListingMessage(parsed.data.listingId, ctx.userId, parsed.data.toUserId, {
      messageId,
      fromUserId: ctx.userId,
      body: parsed.data.body,
      createdAt: Date.now(),
    }),
    notifyListingMessage({
      toUserId: parsed.data.toUserId,
      fromUserId: ctx.userId,
      fromCallsign: me?.callsign ?? 'A driver',
      listingTitle: l.title,
      listingId: l.id,
      preview: parsed.data.body,
    }),
  ]);

  revalidatePath(`/market/messages`);
  revalidatePath(`/market/messages/${l.id}-${parsed.data.toUserId}`);
  return { ok: true, data: { messageId } };
}

export async function markThreadRead(listingId: string, otherUserId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  await db
    .update(listingMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(listingMessages.listingId, listingId),
        eq(listingMessages.fromUserId, otherUserId),
        eq(listingMessages.toUserId, ctx.userId),
        sql`${listingMessages.readAt} IS NULL`,
      ),
    );
  revalidatePath('/market/messages');
  return { ok: true };
}

// ─── Offers ───────────────────────────────────────────────────────────────

export async function makeOffer(raw: unknown): Promise<Result<{ offerId: string }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = makeOfferSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const [l] = await db
    .select({ id: listings.id, sellerId: listings.sellerId, status: listings.status, title: listings.title })
    .from(listings)
    .where(eq(listings.id, parsed.data.listingId))
    .limit(1);
  if (!l) return { ok: false, error: 'Listing not found' };
  if (l.status !== 'active') return { ok: false, error: 'Listing not open to offers' };
  if (l.sellerId === ctx.userId) return { ok: false, error: "You can't offer on your own listing" };

  const offerId = newId();
  await db.insert(listingOffers).values({
    id: offerId,
    listingId: parsed.data.listingId,
    buyerId: ctx.userId,
    amountCents: parsed.data.amountCents,
    currency: 'USD',
    message: parsed.data.message ?? null,
    status: 'pending',
    expiresAt: daysFromNow(OFFER_DEFAULT_EXPIRY_DAYS),
  });

  const [me] = await db
    .select({ callsign: users.callsign })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);
  await notifyOfferReceived({
    sellerId: l.sellerId,
    buyerCallsign: me?.callsign ?? 'A driver',
    listingTitle: l.title,
    listingId: l.id,
    amountCents: parsed.data.amountCents,
  });

  revalidatePath(`/market/${l.id}`);
  return { ok: true, data: { offerId } };
}

export async function respondToOffer(raw: unknown): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = respondOfferSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const [o] = await db
    .select({
      offer: listingOffers,
      listingTitle: listings.title,
      listingSellerId: listings.sellerId,
    })
    .from(listingOffers)
    .innerJoin(listings, eq(listings.id, listingOffers.listingId))
    .where(eq(listingOffers.id, parsed.data.offerId))
    .limit(1);
  if (!o) return { ok: false, error: 'Offer not found' };
  if (o.listingSellerId !== ctx.userId) return { ok: false, error: 'Not your listing' };
  if (o.offer.status !== 'pending') return { ok: false, error: `Offer is ${o.offer.status}` };
  if (o.offer.expiresAt < new Date()) {
    await db.update(listingOffers).set({ status: 'expired' }).where(eq(listingOffers.id, o.offer.id));
    return { ok: false, error: 'Offer has expired' };
  }

  const newStatus = parsed.data.decision === 'accept' ? 'accepted' : 'declined';
  await db
    .update(listingOffers)
    .set({ status: newStatus, respondedAt: new Date() })
    .where(eq(listingOffers.id, o.offer.id));

  const [me] = await db.select({ callsign: users.callsign }).from(users).where(eq(users.id, ctx.userId)).limit(1);

  if (parsed.data.decision === 'accept') {
    await notifyOfferAccepted({
      buyerId: o.offer.buyerId,
      listingTitle: o.listingTitle,
      listingId: o.offer.listingId,
      amountCents: o.offer.amountCents,
      sellerCallsign: me?.callsign ?? 'The seller',
    });
  } else {
    await notifyOfferDeclined({
      buyerId: o.offer.buyerId,
      listingTitle: o.listingTitle,
      listingId: o.offer.listingId,
      sellerCallsign: me?.callsign ?? 'The seller',
    });
  }

  revalidatePath(`/market/${o.offer.listingId}`);
  return { ok: true };
}

export async function withdrawOffer(offerId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [o] = await db.select().from(listingOffers).where(eq(listingOffers.id, offerId)).limit(1);
  if (!o) return { ok: false, error: 'Offer not found' };
  if (o.buyerId !== ctx.userId) return { ok: false, error: 'Not your offer' };
  if (o.status !== 'pending') return { ok: false, error: `Offer is ${o.status}` };

  await db
    .update(listingOffers)
    .set({ status: 'withdrawn', respondedAt: new Date() })
    .where(eq(listingOffers.id, offerId));
  revalidatePath(`/market/${o.listingId}`);
  return { ok: true };
}

// ─── Watchlist ────────────────────────────────────────────────────────────

export async function toggleWatch(listingId: string): Promise<Result<{ watching: boolean }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [existing] = await db
    .select({ id: listingWatches.id })
    .from(listingWatches)
    .where(and(eq(listingWatches.userId, ctx.userId), eq(listingWatches.listingId, listingId)))
    .limit(1);

  if (existing) {
    await db.delete(listingWatches).where(eq(listingWatches.id, existing.id));
    await db
      .update(listings)
      .set({ favoriteCount: sql`GREATEST(${listings.favoriteCount} - 1, 0)` })
      .where(eq(listings.id, listingId));
    revalidatePath('/market/saved');
    revalidatePath(`/market/${listingId}`);
    return { ok: true, data: { watching: false } };
  }

  await db.insert(listingWatches).values({
    id: newId(),
    userId: ctx.userId,
    listingId,
  });
  await db
    .update(listings)
    .set({ favoriteCount: sql`${listings.favoriteCount} + 1` })
    .where(eq(listings.id, listingId));
  revalidatePath('/market/saved');
  revalidatePath(`/market/${listingId}`);
  return { ok: true, data: { watching: true } };
}

// ─── Flag listing ─────────────────────────────────────────────────────────

const flagListingSchema = z.object({
  listingId: z.string().min(1),
  reason: z.enum(['nsfw', 'fake', 'spam', 'harassment', 'other']),
  details: z.string().max(500).optional().nullable(),
});

export async function flagListing(raw: unknown): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = flagListingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  await db.insert(flags).values({
    id: newId(),
    reporterId: ctx.userId,
    subjectType: 'listing',
    subjectId: parsed.data.listingId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
    status: 'pending',
  });

  return { ok: true };
}

// ─── View counter (called from the detail page on read) ───────────────────

export async function incrementViewCount(listingId: string): Promise<void> {
  // Don't count owner's own views
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) {
    await db
      .update(listings)
      .set({ viewCount: sql`${listings.viewCount} + 1` })
      .where(eq(listings.id, listingId));
    return;
  }

  await db
    .update(listings)
    .set({ viewCount: sql`${listings.viewCount} + 1` })
    .where(and(eq(listings.id, listingId), sql`${listings.sellerId} <> ${ctx.userId}`));
}

// ─── Convenience: create + redirect ───────────────────────────────────────

export async function createCarListingAndRedirect(raw: unknown): Promise<void> {
  const result = await createCarListing(raw);
  if (!result.ok) throw new Error(result.error);
  redirect(`/market/${result.data!.listingId}/edit?just_created=1`);
}

export async function createPartListingAndRedirect(raw: unknown): Promise<void> {
  const result = await createPartListing(raw);
  if (!result.ok) throw new Error(result.error);
  redirect(`/market/${result.data!.listingId}/edit?just_created=1`);
}
