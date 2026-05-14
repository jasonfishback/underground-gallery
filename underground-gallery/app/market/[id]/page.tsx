// app/market/[id]/page.tsx — Cars-and-Bids style listing detail.

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

  await incrementViewCount(l.id).catch(() => undefined);

  const isOwner = ctx?.userId === l.sellerId;
  const isCar = l.listingType === 'car';

  // Hero subtitle: e.g. "2018 · BMW · M3 · Competition"
  const subtitleParts = isCar
    ? [l.year, l.make, l.model, l.trim].filter(Boolean)
    : [l.partBrand, l.partCategory].filter(Boolean);

  // Highlights pills (compact key facts under price)
  const highlights = isCar
    ? [
        l.mileage ? `${l.mileage.toLocaleString()} mi` : null,
        l.transmission,
        l.drivetrain,
        l.color,
        l.titleStatus ? `${TITLE_STATUS_LABELS[l.titleStatus]} title` : null,
        CONDITION_LABELS[l.condition],
      ].filter(Boolean)
    : [
        l.partBrand,
        l.partCategory,
        l.partNumber ? `PN ${l.partNumber}` : null,
        CONDITION_LABELS[l.condition],
        l.quantity && l.quantity > 1 ? `Qty ${l.quantity}` : null,
      ].filter(Boolean);

  return (
    <main
      style={{
        padding: '24px 20px 80px',
        maxWidth: 1280,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      {/* Back crumb */}
      <div style={{ marginBottom: 18 }}>
        <Link href={isCar ? '/market/cars' : '/market/parts'} style={crumbStyle}>
          ← {isCar ? 'CARS' : 'PARTS'}
        </Link>
      </div>

      {/* Full-width hero gallery */}
      <ListingGallery photos={photos} fallback={l.primaryPhotoUrl} />

      {/* Hero text block */}
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 24,
          alignItems: 'end',
          marginTop: 28,
          paddingBottom: 22,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div>
          <div style={kickerStyle}>
            {isCar ? 'CAR' : 'PART'}
            {l.status !== 'active' && ` · ${l.status.toUpperCase()}`}
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 4.2vw, 46px)',
              fontWeight: 700,
              margin: '6px 0 8px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            {l.title}
          </h1>
          <div
            style={{
              fontSize: 16,
              color: 'rgba(245,246,247,0.65)',
              fontWeight: 500,
            }}
          >
            {subtitleParts.join(' · ')}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 800,
              color: '#ff3030',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {formatPriceWithType(l.priceCents, l.priceType, l.currency)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(245,246,247,0.5)',
              letterSpacing: '0.18em',
              marginTop: 4,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {PRICE_TYPE_LABELS[l.priceType]?.toUpperCase()}
          </div>
        </div>
      </header>

      {/* Highlights pill row */}
      {highlights.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 18,
          }}
        >
          {highlights.map((h, i) => (
            <span key={i} style={pillStyle}>
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Body grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 360px)',
          gap: 36,
          alignItems: 'start',
          marginTop: 36,
        }}
      >
        {/* LEFT: editorial content */}
        <div style={{ minWidth: 0 }}>
          {l.description && (
            <section style={sectionStyle}>
              <h2 style={sectionHeadingStyle}>About this {isCar ? 'car' : 'part'}</h2>
              <p
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  color: 'rgba(245,246,247,0.88)',
                  fontSize: 16,
                  margin: 0,
                }}
              >
                {l.description}
              </p>
            </section>
          )}

          {l.modsSummary && isCar && (
            <section style={sectionStyle}>
              <h2 style={sectionHeadingStyle}>Modifications</h2>
              <p
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  color: 'rgba(245,246,247,0.88)',
                  fontSize: 16,
                  margin: 0,
                }}
              >
                {l.modsSummary}
              </p>
            </section>
          )}

          <section style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{isCar ? 'Vehicle' : 'Part'} details</h2>
            <div style={specCardStyle}>
              <dl style={dlStyle}>
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
                    <Row label="Condition" value={CONDITION_LABELS[l.condition]} />
                  </>
                ) : (
                  <>
                    <Row label="Category" value={l.partCategory} />
                    <Row label="Brand" value={l.partBrand} />
                    <Row label="Part #" value={l.partNumber} />
                    <Row label="OEM #" value={l.oemNumber} />
                    <Row label="Quantity" value={l.quantity ?? 1} />
                    <Row label="Condition" value={CONDITION_LABELS[l.condition]} />
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
            </div>
          </section>

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

        {/* RIGHT: sticky seller / actions */}
        <aside
          style={{
            position: 'sticky',
            top: 96,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'linear-gradient(180deg, rgba(28,30,40,0.65), rgba(18,20,28,0.65))',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Seller card */}
          <Link
            href={l.sellerCallsign ? `/u/${l.sellerCallsign}` : '#'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              textDecoration: 'none',
              color: '#fff',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: l.sellerImage
                  ? `url(${l.sellerImage}) center/cover`
                  : 'linear-gradient(135deg, #ff3030, #6a0000)',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(245,246,247,0.5)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                SELLER
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {l.sellerCallsign ?? 'Member'}
              </div>
              {l.sellerRegion && (
                <div style={{ fontSize: 12, color: 'rgba(245,246,247,0.55)' }}>
                  {l.sellerRegion}
                </div>
              )}
            </div>
          </Link>

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
              {l.status === 'active' && !isOwner && (
                <OfferModal
                  listingId={l.id}
                  askingPriceCents={l.priceCents}
                  isOwner={isOwner}
                />
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <WatchButton listingId={l.id} initialWatching={watching} />
                {l.status === 'active' && !isOwner && (
                  <Link href={`/market/messages/${l.id}-${l.sellerId}`} className="ug-btn" style={{ flex: 1, textAlign: 'center' }}>
                    Open thread
                  </Link>
                )}
                {isOwner && (
                  <Link href={`/market/${l.id}/edit`} className="ug-btn" style={{ flex: 1, textAlign: 'center' }}>
                    Edit
                  </Link>
                )}
              </div>
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
            <div style={{ fontSize: 13, color: 'rgba(245,246,247,0.65)', lineHeight: 1.5 }}>
              <Link href="/auth/signin" style={{ color: '#ff3030', textDecoration: 'none', fontWeight: 600 }}>
                Sign in
              </Link>{' '}
              to contact the seller.
            </div>
          )}

          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'rgba(245,246,247,0.4)',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 12,
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

const crumbStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.22em',
  color: 'rgba(245,246,247,0.55)',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  textDecoration: 'none',
  fontWeight: 600,
};

const kickerStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.24em',
  color: '#ff3030',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 700,
};

const sectionStyle: React.CSSProperties = {
  marginTop: 32,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.3em',
  color: 'rgba(245,246,247,0.65)',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 700,
  marginBottom: 14,
  textTransform: 'uppercase',
};

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  fontSize: 12,
  color: 'rgba(245,246,247,0.85)',
  fontWeight: 500,
  letterSpacing: '0.02em',
};

const specCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '18px 22px',
};

const dlStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '160px 1fr',
  rowGap: 10,
  columnGap: 24,
  fontSize: 14,
  margin: 0,
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <>
      <dt style={{ color: 'rgba(245,246,247,0.55)', fontSize: 13, fontWeight: 500 }}>{label}</dt>
      <dd style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 500 }}>{value as React.ReactNode}</dd>
    </>
  );
}
