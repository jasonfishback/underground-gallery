// components/market/MarketCard.tsx
//
// Facebook-Marketplace style listing card: square edge-to-edge photo,
// bold price first, title, a short description snippet, then location +
// freshness. Chrome-less — just a rounded photo and a text stack.

'use client';

import Link from 'next/link';
import { formatPriceWithType } from '@/lib/market/types';
import type { ListingCard as ListingCardData } from '@/lib/market/queries';
import { colors, fonts } from '@/lib/design';

function timeAgo(input: Date | string | null): string | null {
  if (!input) return null;
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return null;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function MarketCard({ listing }: { listing: ListingCardData }) {
  const photo = listing.primaryPhotoThumb || listing.primaryPhotoUrl;
  const isCar = listing.listingType === 'car';

  const price = formatPriceWithType(listing.priceCents, listing.priceType, listing.currency);
  const posted = timeAgo(listing.publishedAt ?? listing.createdAt);
  const isSold = listing.status === 'sold';

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
      className="ug-market-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        fontFamily: fonts.sans,
      }}
    >
      {/* Square photo, FB Marketplace style */}
      <div
        style={{
          aspectRatio: '1 / 1',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${colors.border}`,
          background: 'linear-gradient(135deg, #1a1d28, #0f1119)',
        }}
      >
        {photo && (
          <div
            className="ug-market-card-photo"
            style={{
              position: 'absolute',
              inset: 0,
              background: `${colors.bgElevated} url(${photo}) center / cover no-repeat`,
              filter: isSold ? 'grayscale(0.7) brightness(0.7)' : undefined,
            }}
          />
        )}
        {statusBadge && (
          <span style={badgeStyle(statusBadge.bg)}>{statusBadge.label}</span>
        )}
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '4px 9px',
            fontSize: 9,
            letterSpacing: '0.2em',
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

      {/* Text stack: price → title → description → location · time */}
      <div style={{ padding: '10px 4px 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: colors.text,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {price}
        </div>
        <div
          style={{
            fontSize: 14,
            color: colors.text,
            lineHeight: 1.35,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {listing.title}
        </div>
        {listing.description && (
          <div
            style={{
              fontSize: 12.5,
              color: colors.textMuted,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {listing.description}
          </div>
        )}
        <div
          style={{
            fontSize: 12,
            color: colors.textDim,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {[listing.locationLabel, posted].filter(Boolean).join(' · ')}
        </div>
      </div>
    </Link>
  );
}

function badgeStyle(bg: string): React.CSSProperties {
  return {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: '4px 9px',
    fontSize: 9,
    letterSpacing: '0.2em',
    background: bg,
    color: '#fff',
    fontWeight: 700,
    fontFamily: fonts.mono,
    borderRadius: 4,
  };
}
