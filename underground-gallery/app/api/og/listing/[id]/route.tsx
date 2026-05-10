// app/api/og/listing/[id]/route.tsx
//
// Dynamic 1200×630 PNG for marketplace listings. Used for OG/Twitter cards
// when a listing is shared.

import { ImageResponse } from 'next/og';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { listings, photos, users } from '@/lib/db/schema';
import { formatPriceWithType } from '@/lib/market/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .select({
      listing: listings,
      photoUrl: photos.urlFull,
      sellerCallsign: users.callsign,
    })
    .from(listings)
    .leftJoin(photos, eq(photos.id, listings.primaryPhotoId))
    .leftJoin(users, eq(users.id, listings.sellerId))
    .where(eq(listings.id, id))
    .limit(1);

  if (!row || row.listing.status === 'removed') {
    return new ImageResponse(<NotFoundCard />, { width: 1200, height: 630 });
  }

  const l = row.listing;
  const isCar = l.listingType === 'car';
  const subtitle = isCar
    ? [l.year, l.make, l.model, l.trim].filter(Boolean).join(' ')
    : [l.partBrand, l.partCategory].filter(Boolean).join(' · ');

  const price = formatPriceWithType(l.priceCents, l.priceType, l.currency);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0a0c12',
          color: '#fff',
        }}
      >
        {/* Left: photo */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            background: row.photoUrl
              ? `url(${row.photoUrl}) center / cover no-repeat`
              : 'linear-gradient(135deg, #1a1d28, #0f1119)',
          }}
        />
        {/* Right: text */}
        <div
          style={{
            width: 540,
            padding: 56,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'rgba(10,12,18,0.95)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 18,
                letterSpacing: 8,
                color: '#ff3030',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              UNDERGROUND · {isCar ? 'CAR' : 'PART'}
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: 18,
              }}
            >
              {l.title.length > 70 ? l.title.slice(0, 67) + '…' : l.title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 22, color: 'rgba(245,246,247,0.7)' }}>{subtitle}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: '#ff3030' }}>{price}</div>
            <div
              style={{
                fontSize: 16,
                color: 'rgba(245,246,247,0.5)',
                letterSpacing: 4,
                marginTop: 6,
              }}
            >
              LISTED BY {(row.sellerCallsign ?? 'MEMBER').toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function NotFoundCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0c12',
        color: '#fff',
        fontSize: 36,
      }}
    >
      Listing not found
    </div>
  );
}
