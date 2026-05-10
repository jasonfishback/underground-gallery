// app/market/[id]/edit/page.tsx
//
// Edit an existing listing — full form + photo uploader + publish/unpublish.

import { redirect, notFound } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { vehicles } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { getListingDetail, getListingPhotos } from '@/lib/market/queries';
import { CarListingForm } from '@/components/market/CarListingForm';
import { PartListingForm } from '@/components/market/PartListingForm';
import { MarketPhotoUploader } from '@/components/market/MarketPhotoUploader';
import { ListingLifecyclePanel } from '@/components/market/ListingLifecyclePanel';
import { MAX_PHOTOS_PER_LISTING } from '@/lib/market/types';

export const dynamic = 'force-dynamic';

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ just_created?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const listing = await getListingDetail(id);
  if (!listing) notFound();
  if (listing.sellerId !== ctx.userId && !ctx.isModerator) redirect(`/market/${id}`);

  const photos = await getListingPhotos(listing.id);

  const garage = listing.listingType === 'car'
    ? await db
        .select({
          id: vehicles.id,
          year: vehicles.year,
          make: vehicles.make,
          model: vehicles.model,
          trim: vehicles.trim,
          color: vehicles.color,
          vin: vehicles.vin,
        })
        .from(vehicles)
        .where(eq(vehicles.userId, ctx.userId))
        .orderBy(desc(vehicles.createdAt))
    : [];

  const initialCar = listing.listingType === 'car'
    ? {
        title: listing.title,
        description: listing.description ?? '',
        priceCents: listing.priceCents != null ? String(Math.round(listing.priceCents / 100)) : '',
        priceType: listing.priceType,
        condition: listing.condition,
        year: listing.year != null ? String(listing.year) : '',
        make: listing.make ?? '',
        model: listing.model ?? '',
        trim: listing.trim ?? '',
        bodyStyle: listing.bodyStyle ?? '',
        vin: listing.vin ?? '',
        mileage: listing.mileage != null ? String(listing.mileage) : '',
        color: listing.color ?? '',
        transmission: listing.transmission ?? '',
        drivetrain: listing.drivetrain ?? '',
        titleStatus: (listing.titleStatus ?? '') as any,
        modsSummary: listing.modsSummary ?? '',
        garageVehicleId: listing.garageVehicleId ?? '',
        locationLabel: listing.locationLabel ?? '',
      }
    : undefined;

  const initialPart = listing.listingType === 'part'
    ? {
        title: listing.title,
        description: listing.description ?? '',
        priceCents: listing.priceCents != null ? String(Math.round(listing.priceCents / 100)) : '',
        priceType: listing.priceType,
        condition: listing.condition,
        partCategory: listing.partCategory as any,
        partBrand: listing.partBrand ?? '',
        partNumber: listing.partNumber ?? '',
        oemNumber: listing.oemNumber ?? '',
        fitmentMake: listing.fitmentMake ?? '',
        fitmentModel: listing.fitmentModel ?? '',
        fitmentYearFrom: listing.fitmentYearFrom != null ? String(listing.fitmentYearFrom) : '',
        fitmentYearTo: listing.fitmentYearTo != null ? String(listing.fitmentYearTo) : '',
        fitmentTrim: listing.fitmentTrim ?? '',
        fitmentNotes: listing.fitmentNotes ?? '',
        quantity: String(listing.quantity ?? 1),
        locationLabel: listing.locationLabel ?? '',
      }
    : undefined;

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 1080,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <a
          href={`/market/${listing.id}`}
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'rgba(245,246,247,0.55)',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            textDecoration: 'none',
          }}
        >
          ← VIEW LISTING
        </a>
      </div>

      <h1 style={{ fontSize: 26, margin: '0 0 4px' }}>
        Edit listing
      </h1>
      <p style={{ color: 'rgba(245,246,247,0.6)', fontSize: 14, marginBottom: 18 }}>
        Status: <strong style={{ color: '#fff' }}>{listing.status.toUpperCase()}</strong>
        {sp.just_created && ' · Draft saved. Add photos and publish below.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 28, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section>
            <h2 style={sectionHeadingStyle}>Photos</h2>
            <MarketPhotoUploader
              listingId={listing.id}
              initialPhotos={photos.map((p) => ({ id: p.id, urlFull: p.urlFull, urlThumb: p.urlThumb }))}
              primaryPhotoId={listing.primaryPhotoId}
              maxPhotos={MAX_PHOTOS_PER_LISTING}
            />
          </section>

          <section>
            <h2 style={sectionHeadingStyle}>Listing details</h2>
            {listing.listingType === 'car' ? (
              <CarListingForm
                mode="edit"
                listingId={listing.id}
                garageVehicles={garage}
                initial={initialCar}
              />
            ) : (
              <PartListingForm mode="edit" listingId={listing.id} initial={initialPart} />
            )}
          </section>
        </div>

        <ListingLifecyclePanel
          listingId={listing.id}
          status={listing.status}
          expiresAt={listing.expiresAt}
          publishedAt={listing.publishedAt}
        />
      </div>
    </main>
  );
}

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.3em',
  color: 'rgba(245,246,247,0.6)',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 700,
  marginBottom: 12,
  textTransform: 'uppercase',
};
