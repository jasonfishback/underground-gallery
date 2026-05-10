// lib/market/types.ts
//
// Zod schemas, enum mirrors, and small helpers for the Marketplace module.
// Server actions in app/market/actions.ts validate against these.

import { z } from 'zod';
import {
  LISTING_TYPES,
  LISTING_CONDITIONS,
  LISTING_PRICE_TYPES,
  LISTING_TITLE_STATUSES,
  PART_CATEGORIES,
} from '@/lib/db/schema';

// ── Reusable enums ─────────────────────────────────────────────────────────

export const listingTypeSchema = z.enum(LISTING_TYPES);
export const listingConditionSchema = z.enum(LISTING_CONDITIONS);
export const listingPriceTypeSchema = z.enum(LISTING_PRICE_TYPES);
export const listingTitleStatusSchema = z.enum(LISTING_TITLE_STATUSES);
export const partCategorySchema = z.enum(PART_CATEGORIES);

// ── Common form fields ─────────────────────────────────────────────────────

const baseListingSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters').max(140),
  description: z.string().trim().max(8000).optional().nullable(),
  priceCents: z.number().int().min(0).max(1_000_000_00).optional().nullable(),
  priceType: listingPriceTypeSchema.default('firm'),
  condition: listingConditionSchema,
  // Photos uploaded ahead of submit; we accept their IDs here
  photoIds: z.array(z.string()).max(20).default([]),
  primaryPhotoId: z.string().nullable().optional(),
  // Location is optional — falls back to seller's user.region* on the server
  locationLabel: z.string().max(120).optional().nullable(),
  locationLat: z.number().optional().nullable(),
  locationLng: z.number().optional().nullable(),
  locationCountry: z.string().max(2).optional().nullable(),
  locationAdmin1: z.string().max(80).optional().nullable(),
});

// ── Car listing ────────────────────────────────────────────────────────────

export const carListingFormSchema = baseListingSchema.extend({
  listingType: z.literal('car'),
  // Optional — autofills from a garage vehicle if linked
  garageVehicleId: z.string().nullable().optional(),
  year: z.number().int().min(1900).max(2100),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  trim: z.string().trim().max(80).optional().nullable(),
  bodyStyle: z.string().trim().max(40).optional().nullable(),
  vin: z.string().trim().max(20).optional().nullable(),
  mileage: z.number().int().min(0).max(2_000_000).optional().nullable(),
  color: z.string().trim().max(40).optional().nullable(),
  transmission: z.string().trim().max(30).optional().nullable(),
  drivetrain: z.string().trim().max(10).optional().nullable(),
  titleStatus: listingTitleStatusSchema.optional().nullable(),
  modsSummary: z.string().trim().max(2000).optional().nullable(),
});
export type CarListingFormInput = z.infer<typeof carListingFormSchema>;

// ── Part listing ───────────────────────────────────────────────────────────

export const partListingFormSchema = baseListingSchema.extend({
  listingType: z.literal('part'),
  partCategory: partCategorySchema,
  partBrand: z.string().trim().max(80).optional().nullable(),
  partNumber: z.string().trim().max(80).optional().nullable(),
  oemNumber: z.string().trim().max(80).optional().nullable(),
  fitmentMake: z.string().trim().max(60).optional().nullable(),
  fitmentModel: z.string().trim().max(80).optional().nullable(),
  fitmentYearFrom: z.number().int().min(1900).max(2100).optional().nullable(),
  fitmentYearTo: z.number().int().min(1900).max(2100).optional().nullable(),
  fitmentTrim: z.string().trim().max(80).optional().nullable(),
  fitmentNotes: z.string().trim().max(500).optional().nullable(),
  quantity: z.number().int().min(1).max(9999).default(1),
});
export type PartListingFormInput = z.infer<typeof partListingFormSchema>;

// ── Discriminated union ────────────────────────────────────────────────────

export const listingFormSchema = z.discriminatedUnion('listingType', [
  carListingFormSchema,
  partListingFormSchema,
]);
export type ListingFormInput = z.infer<typeof listingFormSchema>;

// ── Update / lifecycle ─────────────────────────────────────────────────────

export const updateListingSchema = listingFormSchema.and(z.object({ listingId: z.string() }));

// ── Messaging ──────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  listingId: z.string().min(1),
  toUserId: z.string().min(1),
  body: z.string().trim().min(1, 'Message cannot be empty').max(2000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ── Offers ─────────────────────────────────────────────────────────────────

export const makeOfferSchema = z.object({
  listingId: z.string().min(1),
  amountCents: z.number().int().min(100).max(1_000_000_00),
  message: z.string().trim().max(500).optional().nullable(),
});
export type MakeOfferInput = z.infer<typeof makeOfferSchema>;

export const respondOfferSchema = z.object({
  offerId: z.string().min(1),
  decision: z.enum(['accept', 'decline']),
});

// ── Filters / browse ───────────────────────────────────────────────────────

export const browseFilterSchema = z.object({
  type: listingTypeSchema.optional(),
  q: z.string().trim().max(120).optional(),
  category: partCategorySchema.optional(),
  make: z.string().max(60).optional(),
  model: z.string().max(80).optional(),
  yearMin: z.number().int().min(1900).max(2100).optional(),
  yearMax: z.number().int().min(1900).max(2100).optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  condition: listingConditionSchema.optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc']).default('newest'),
  page: z.number().int().min(1).max(500).default(1),
  pageSize: z.number().int().min(1).max(60).default(24),
});
export type BrowseFilters = z.infer<typeof browseFilterSchema>;

// ── Display helpers ────────────────────────────────────────────────────────

export const CONDITION_LABELS: Record<typeof LISTING_CONDITIONS[number], string> = {
  new: 'New',
  like_new: 'Like new',
  used: 'Used',
  for_parts: 'For parts',
  project: 'Project',
};

export const PRICE_TYPE_LABELS: Record<typeof LISTING_PRICE_TYPES[number], string> = {
  firm: 'Firm',
  obo: 'OBO',
  trade: 'Trade considered',
  free: 'Free',
};

export const TITLE_STATUS_LABELS: Record<typeof LISTING_TITLE_STATUSES[number], string> = {
  clean: 'Clean title',
  salvage: 'Salvage',
  rebuilt: 'Rebuilt',
  bonded: 'Bonded',
  other: 'Other',
};

export function formatPrice(cents: number | null | undefined, currency = 'USD'): string {
  if (cents == null) return '—';
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString()}`;
  }
}

export function formatPriceWithType(
  cents: number | null | undefined,
  priceType: typeof LISTING_PRICE_TYPES[number],
  currency = 'USD',
): string {
  if (priceType === 'free' || cents === 0) return 'Free';
  if (priceType === 'trade' && (cents == null || cents === 0)) return 'Trade only';
  const base = formatPrice(cents, currency);
  if (priceType === 'obo') return `${base} OBO`;
  return base;
}

export function listingTitleFor(l: {
  listingType: 'car' | 'part';
  title: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
}): string {
  // Prefer the user-entered title; fall back to a generated label for cars
  if (l.title?.trim()) return l.title;
  if (l.listingType === 'car' && l.year && l.make && l.model) {
    return `${l.year} ${l.make} ${l.model}${l.trim ? ' ' + l.trim : ''}`;
  }
  return 'Untitled listing';
}

// Default expiry for new listings: 30 days
export const LISTING_DEFAULT_EXPIRY_DAYS = 30;

// Default expiry for offers: 7 days
export const OFFER_DEFAULT_EXPIRY_DAYS = 7;

// Limits
export const MAX_ACTIVE_LISTINGS_PER_USER = 5;
export const MAX_PHOTOS_PER_LISTING = 20;
