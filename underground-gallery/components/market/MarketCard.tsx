// components/market/MarketCard.tsx
//
// Cars-and-Bids style listing card. Big edge-to-edge photo, minimal chrome,
// title + price hero block underneath. Uses .ug-card for hover lift.

'use client';

import Link from 'next/link';
import { CONDITION_LABELS, formatPriceWithType } from '@/lib/market/types';
import type { ListingCard as ListingCardData } from '@/lib/market/queries';
import { colors, fonts } from '@/lib/design';

export function MarketCard({ listing }: { listing: ListingCardData }) {
  const photo = listing.primaryPhotoThumb || listing.primaryPhotoUrl;
  const isCar = listing.listingType === 'car';

  const subtitle = isCar
    ? [listing.year, listing.make, listing.model, listing.trim].filter(Boolean).join(' ')
    : [
        listing.partBrand,
        listing.partCategory,
        listing.fitmentMake && listing.fitmentModel
          ? `Fits ${listing.fitmentMake} ${listing.fitmentModel}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ');

  const price = formatPriceWithType(listing.priceCents, listing.priceType, listing.currency);

  const statusBadge =
    listing.status === 'sold'
      ? { label: 'SOLD', bg: colors.accent }
      : listing.status === 'expired'
        ? { label: 'EXPIRED', bg: '#555' }
        : listing.status === 'draft'
          ? { label: 'DRAFT', bg: '#aa8800' }
          : null;

  return (
    <Link
      href={`/market/${listing.id}`}
      className="ug-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 10',
          background: photo
            ? `${colors.bgElevated} url(${photo}) center / cover no-repeat`
            : 'linear-gradient(135deg, #1a1d28, #0f1119)',
          position: 'relative',
        }}
      >
        {statusBadge && (
          <span style={badgeStyle(statusBadge.bg)}>{statusBadge.label}</span>
        )}
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '5px 10px',
            fontSize: 9,
            letterSpacing: '0.22em',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#fff',
            fontWeight: 700,
            fontFamily: fonts.mono,
            borderRadius: 999,
            border: `1px solid ${colors.borderStrong}`,
          }}
        >
          {isCar ? 'CAR' : 'PART'}
        </span>
      </div>
      <div
        style={{
          padding: '16px 18px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
              color: colors.text,
              lineHeight: 1.3,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            {listing.title}
          </h3>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: colors.accent,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            {price}
          </span>
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
            paddingTop: 10,
            borderTop: `1px solid ${colors.border}`,
            fontSize: 10,
            letterSpacing: '0.2em',
            color: colors.textDim,
            fontFamily: fonts.mono,
          }}
        >
          <span>{CONDITION_LABELS[listing.condition].toUpperCase()}</span>
          {listing.locationLabel && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
              {listing.locationLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function badgeStyle(bg: string): React.CSSProperties {
  return {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '5px 10px',
    fontSize: 9,
    letterSpacing: '0.22em',
    background: bg,
    color: '#fff',
    fontWeight: 700,
    fontFamily: fonts.mono,
    borderRadius: 4,
  };
}
