// lib/market/notifications.ts
//
// Marketplace-specific notification helpers. Wraps the generic notify()
// service so call sites don't have to know the exact title/body format.

import { notify } from '@/lib/notifications/service';
import { formatPrice } from '@/lib/market/types';

export async function notifyListingMessage(opts: {
  toUserId: string;
  fromUserId: string;
  fromCallsign: string;
  listingTitle: string;
  listingId: string;
  preview: string;
}) {
  return notify({
    userId: opts.toUserId,
    kind: 'listing_message',
    title: `${opts.fromCallsign} sent you a message`,
    body: `${opts.listingTitle} — "${opts.preview.slice(0, 140)}"`,
    // Thread URL format is `<listingId>-<otherUserId>` where otherUserId is
    // the *sender* (the recipient navigates to the conversation with them).
    link: `/market/messages/${opts.listingId}-${opts.fromUserId}`,
    metadata: { listingId: opts.listingId, fromUserId: opts.fromUserId },
  });
}

export async function notifyOfferReceived(opts: {
  sellerId: string;
  buyerCallsign: string;
  listingTitle: string;
  listingId: string;
  amountCents: number;
}) {
  return notify({
    userId: opts.sellerId,
    kind: 'listing_offer_received',
    title: `${opts.buyerCallsign} offered ${formatPrice(opts.amountCents)} on ${opts.listingTitle}`,
    body: 'Tap to accept, decline, or counter.',
    link: `/market/${opts.listingId}#offers`,
    metadata: { listingId: opts.listingId, amountCents: opts.amountCents },
  });
}

export async function notifyOfferAccepted(opts: {
  buyerId: string;
  listingTitle: string;
  listingId: string;
  amountCents: number;
  sellerCallsign: string;
}) {
  return notify({
    userId: opts.buyerId,
    kind: 'listing_offer_accepted',
    title: `${opts.sellerCallsign} accepted your ${formatPrice(opts.amountCents)} offer`,
    body: `On "${opts.listingTitle}". Reach out to arrange the deal.`,
    link: `/market/${opts.listingId}`,
    metadata: { listingId: opts.listingId },
  });
}

export async function notifyOfferDeclined(opts: {
  buyerId: string;
  listingTitle: string;
  listingId: string;
  sellerCallsign: string;
}) {
  return notify({
    userId: opts.buyerId,
    kind: 'listing_offer_declined',
    title: `${opts.sellerCallsign} declined your offer`,
    body: `On "${opts.listingTitle}".`,
    link: `/market/${opts.listingId}`,
    metadata: { listingId: opts.listingId },
  });
}

export async function notifyWatchedSold(opts: {
  watcherId: string;
  listingTitle: string;
  listingId: string;
}) {
  return notify({
    userId: opts.watcherId,
    kind: 'listing_watched_sold',
    title: `Sold: ${opts.listingTitle}`,
    body: 'A listing on your watchlist just sold.',
    link: `/market/${opts.listingId}`,
    metadata: { listingId: opts.listingId },
  });
}

export async function notifyExpiringSoon(opts: {
  sellerId: string;
  listingTitle: string;
  listingId: string;
  daysLeft: number;
}) {
  return notify({
    userId: opts.sellerId,
    kind: 'listing_expiring_soon',
    title: `${opts.listingTitle} expires in ${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'}`,
    body: 'Bump it to keep it active for another 30 days.',
    link: `/market/mine`,
    metadata: { listingId: opts.listingId },
  });
}
