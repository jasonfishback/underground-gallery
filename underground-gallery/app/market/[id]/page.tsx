// app/market/[id]/page.tsx — full listing detail.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getAuthContext } from '@/lib/auth/gates';
import {
  getListingDetail,
  getListingPhotos,
  isListingWatched,
  getOffersForListing,
} from '@/lib/market/queries';
import {
  CONDITION_LABELS,
  PRICE_TYPE_LABELS,
  TITLE_STATUS_LABELS,
  formatPriceWithType,
} from '@/lib/market/types';
import { ListingGallery } from '@/components/market/ListingGallery';
import { ContactSheet } from '@/components/market/ContactSheet';
import { WatchButton } from '@/components/market/WatchButton';
import { OfferModal } from '@/components/market/OfferModal';
import { SellerOfferList } from '@/components/market/OfferList';
import { incrementViewCount } from '@/app/market/actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const l = await getListingDetail(id);
  if (!l) return { title: 'Listing not found' };
  return {
    title: l.title,
    description: l.description?.slice(0, 160) ?? `${l.listingType === 'car' ? 'Car' : 'Part'} for sale`,
    openGraph: {
      title: l.title,
      description: l.description?.slice(0, 160) ?? undefined,
      images: [{ url: `/api/og/listing/${id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: l.title,
      images: [`/api/og/listing/${id}`],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAuthContext();
  const l = await getListingDetail(id);
  if (!l || l.status === 'removed') notFound();

  const [photos, watching, offers] = await Promise.all([
    getListingPhotos(l.id),
    ctx ? isListingWatched(ctx.userId, l.id) : false,
    ctx?.userId === l.sellerId ? getOffersForListing(l.id) : Promise.resolve([]),
  ]);

  // Fire-and-forget view count bump
  await incrementViewCount(l.id).catch(() => undefined);

  const isOwner = ctx?.userId === l.sellerId;
  const isCar = l.listingType === 'car';

  const subtitleParts = isCar
    ? [l.year, l.make, l.model, l.trim].filter(Boolean)
    : [l.partBrand, l.partCategory].filter(Boolean);

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 1180,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <Link
          href={isCar ? '/market/cars' : '/market/parts'}
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'rgba(245,246,247,0.55)',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            textDecoration: 'none',
          }}
        >
          ← {isCar ? 'CARS' : 'PARTS'}
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* Left: gallery */}
        <div>
          <ListingGallery photos={photos} fallback={l.primaryPhotoUrl} />

          {l.description && (
            <section style={sectionStyle}>
              <h2 style={sectionHeadingStyle}>Description</h2>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'rgba(245,246,247,0.85)' }}>
                {l.description}
              </p>
            </section>
          )}

          {/* Spec table */}
          <section style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{isCar ? 'Vehicle' : 'Part'} details</h2>
            <dl style={dlStyle}>
              <Row label="Condition" value={CONDITION_LABELS[l.condition]} />
              {isCar ? (
                <>
                  <Row label="Year" value={l.year} />
                  <Row label="Make" value={l.make} />
                  <Row label="Model" value={l.model} />
                  <Row label="Trim" value={l.trim} />
                  <Row label="Body style" value={l.bodyStyle} />
                  <Row label="Mileage" value={l.mileage ? `${l.mileage.toLocaleString()} mi` : null} />
                  <Row label="Color" value={l.color} />
                  <Row label="Transmission" value={l.transmission} />
                  <Row label="Drivetrain" value={l.drivetrain} />
                  <Row label="Title" value={l.titleStatus ? TITLE_STATUS_LABELS[l.titleStatus] : null} />
                  <Row label="VIN" value={l.vin ? `${l.vin.slice(0, 4)}…${l.vin.slice(-4)}` : null} />
                </>
              ) : (
                <>
                  <Row label="Category" value={l.partCategory} />
                  <Row label="Brand" value={l.partBrand} />
                  <Row label="Part #" value={l.partNumber} />
                  <Row label="OEM #" value={l.oemNumber} />
                  <Row label="Quantity" value={l.quantity ?? 1} />
                  <Row
                    label="Fits"
                    value={
                      [
                        l.fitmentMake,
                        l.fitmentModel,
                        l.fitmentYearFrom && l.fitmentYearTo && l.fitmentYearFrom !== l.fitmentYearTo
                          ? `${l.fitmentYearFrom}–${l.fitmentYearTo}`
                          : l.fitmentYearFrom ?? l.fitmentYearTo,
                        l.fitmentTrim,
                      ]
                        .filter(Boolean)
                        .join(' ') || null
                    }
                  />
                  <Row label="Notes" value={l.fitmentNotes} />
                </>
              )}
            </dl>
          </section>

          {l.modsSummary && isCar && (
            <section style={sectionStyle}>
              <h2 style={sectionHeadingStyle}>Mods</h2>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'rgba(245,246,247,0.85)' }}>
                {l.modsSummary}
              </p>
            </section>
          )}

          {/* Owner-only: offers */}
          {isOwner && (
            <section style={sectionStyle} id="offers">
              <h2 style={sectionHeadingStyle}>Offers</h2>
              <SellerOfferList
                offers={offers.map((o: any) => ({
                  id: o.offer.id,
                  amountCents: o.offer.amountCents,
                  message: o.offer.message,
                  status: o.offer.status,
                  createdAt: o.offer.createdAt,
                  expiresAt: o.offer.expiresAt,
                  buyerCallsign: o.buyerCallsign,
                }))}
              />
            </section>
          )}
        </div>

        {/* Right: sticky action panel */}
        <aside
          style={{
            position: 'sticky',
            top: 84,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            background: 'rgba(20,22,30,0.55)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 22,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.22em',
                color: 'rgba(255,42,42,0.85)',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {isCar ? 'CAR' : 'PART'}
              {l.status !== 'active' && ` · ${l.status.toUpperCase()}`}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>
              {l.title}
            </h1>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(245,246,247,0.55)',
                marginTop: 4,
              }}
            >
              {subtitleParts.join(' · ')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#ff3030' }}>
              {formatPriceWithType(l.priceCents, l.priceType, l.currency)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(245,246,247,0.5)', letterSpacing: '0.15em' }}>
              {PRICE_TYPE_LABELS[l.priceType]?.toUpperCase()}
            </div>
          </div>

          {/* Seller card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: l.sellerImage
                  ? `url(${l.sellerImage}) center/cover`
                  : 'linear-gradient(135deg, #ff3030, #6a0000)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                href={l.sellerCallsign ? `/u/${l.sellerCallsign}` : '#'}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  textDecoration: 'none',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {l.sellerCallsign ?? 'Member'}
              </Link>
              {l.sellerRegion && (
                <div style={{ fontSize: 12, color: 'rgba(245,246,247,0.55)' }}>
                  {l.sellerRegion}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {ctx ? (
            <>
              {l.status === 'active' && !isOwner && (
                <ContactSheet
                  listingId={l.id}
                  sellerId={l.sellerId}
                  sellerCallsign={l.sellerCallsign}
                  isOwner={isOwner}
                />
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <WatchButton listingId={l.id} initialWatching={watching} />
                {l.status === 'active' && !isOwner && (
                  <Link href={`/market/messages/${l.id}-${l.sellerId}`} className="ug-btn">
                    Open thread
                  </Link>
                )}
                {isOwner && (
                  <Link href={`/market/${l.id}/edit`} className="ug-btn">
                    Edit
                  </Link>
                )}
              </div>
              {l.status === 'active' && !isOwner && (
                <OfferModal
                  listingId={l.id}
                  askingPriceCents={l.priceCents}
                  isOwner={isOwner}
                />
              )}
              {!isOwner && (
                <Link
                  href={`/market/${l.id}/flag`}
                  style={{
                    fontSize: 11,
                    color: 'rgba(245,246,247,0.4)',
                    textAlign: 'center',
                    textDecoration: 'underline',
                  }}
                >
                  Report this listing
                </Link>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(245,246,247,0.55)' }}>
              Sign in to contact the seller.
            </div>
          )}

          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              color: 'rgba(245,246,247,0.4)',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 10,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{l.viewCount} VIEWS</span>
            <span>{l.favoriteCount} SAVED</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

const sectionStyle: React.CSSProperties = {
  marginTop: 28,
  paddingTop: 22,
  borderTop: '1px solid rgba(255,255,255,0.06)',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.3em',
  color: 'rgba(245,246,247,0.6)',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 700,
  marginBottom: 12,
  textTransform: 'uppercase',
};

const dlStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '160px 1fr',
  gap: '8px 18px',
  fontSize: 14,
  margin: 0,
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <>
      <dt style={{ color: 'rgba(245,246,247,0.5)', fontSize: 12 }}>{label}</dt>
      <dd style={{ margin: 0, color: '#fff' }}>{value as React.ReactNode}</dd>
    </>
  );
}
