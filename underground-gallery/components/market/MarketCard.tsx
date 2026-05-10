// components/market/MarketCard.tsx
//
// Card used in browse / mine / saved grids. One per listing.

import Link from 'next/link';
import { CONDITION_LABELS, formatPriceWithType } from '@/lib/market/types';
import type { ListingCard as ListingCardData } from '@/lib/market/queries';

export function MarketCard({ listing }: { listing: ListingCardData }) {
  const photo = listing.primaryPhotoThumb || listing.primaryPhotoUrl;
  const isCar = listing.listingType === 'car';

  const subtitle = isCar
    ? [
        listing.year,
        listing.make,
        listing.model,
        listing.trim,
      ]
        .filter(Boolean)
        .join(' ')
    : [
        listing.partBrand,
        listing.partCategory,
        listing.fitmentMake && listing.fitmentModel
          ? `fits ${listing.fitmentMake} ${listing.fitmentModel}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ');

  const price = formatPriceWithType(listing.priceCents, listing.priceType, listing.currency);

  const badgeColor =
    listing.status === 'sold'
      ? '#ff2a2a'
      : listing.status === 'expired'
        ? '#666'
        : listing.status === 'draft'
          ? '#aa8800'
          : null;

  return (
    <Link
      href={`/market/${listing.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(20,22,30,0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div
        style={{
          aspectRatio: '4 / 3',
          background:
            photo
              ? `#0a0c12 url(${photo}) center / cover no-repeat`
              : 'linear-gradient(135deg, #1a1d28, #0f1119)',
          position: 'relative',
        }}
      >
        {badgeColor && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              padding: '4px 8px',
              fontSize: 9,
              letterSpacing: '0.2em',
              background: badgeColor,
              color: '#fff',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              borderRadius: 4,
            }}
          >
            {listing.status.toUpperCase()}
          </span>
        )}
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '4px 8px',
            fontSize: 9,
            letterSpacing: '0.2em',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {isCar ? 'CAR' : 'PART'}
        </span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              margin: 0,
              color: '#fff',
              lineHeight: 1.3,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {listing.title}
          </h3>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#ff3030', whiteSpace: 'nowrap' }}>
            {price}
          </span>
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'rgba(245,246,247,0.6)', lineHeight: 1.4 }}>
            {subtitle}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
            fontSize: 10,
            letterSpacing: '0.18em',
            color: 'rgba(245,246,247,0.45)',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          <span>{CONDITION_LABELS[listing.condition].toUpperCase()}</span>
          {listing.locationLabel && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
              {listing.locationLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
