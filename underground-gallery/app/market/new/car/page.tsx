// app/market/new/car/page.tsx — create a car listing.

import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { vehicles } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { CarListingForm } from '@/components/market/CarListingForm';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'List a car' };

export default async function NewCarListingPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const myGarage = await db
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
    .orderBy(desc(vehicles.createdAt));

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 880,
        margin: '0 auto',
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: colors.accent,
          fontFamily: fonts.mono,
          fontWeight: 700,
        }}
      >
        ∕∕ UNDERGROUND · LIST A CAR
      </div>
      <h1 style={{ fontSize: 28, margin: '8px 0 4px' }}>Tell us about it</h1>
      <p style={{ color: colors.textMuted, marginBottom: 24, fontSize: 14 }}>
        We'll save a draft. You'll add photos and publish on the next screen.
      </p>
      <CarListingForm mode="create" garageVehicles={myGarage} />
    </main>
  );
}
