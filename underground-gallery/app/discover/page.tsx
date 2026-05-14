// app/discover/page.tsx
//
// Tinder-style swipe deck of car builds. Members swipe right to save, left
// to pass, or tap a card to open the full vehicle detail page.

import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { vehicles, users, photos } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { SwipeDeck } from '@/components/discover/SwipeDeck';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Swipe through car builds from members of the Underground Gallery.',
};

export const dynamic = 'force-dynamic';

export type DiscoverCard = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  name: string | null;
  notes: string | null;
  ownerCallsign: string | null;
  ownerRegion: string | null;
  photoUrl: string | null;
};

export default async function DiscoverPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');
  if (session.user.status !== 'active') redirect('/pending');

  const rows = await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      name: vehicles.name,
      notes: vehicles.notes,
      ownerCallsign: users.callsign,
      ownerRegion: users.regionLabel,
      photoUrl: photos.urlFull,
    })
    .from(vehicles)
    .leftJoin(users, eq(users.id, vehicles.userId))
    .leftJoin(photos, eq(photos.id, vehicles.primaryPhotoId))
    .where(and(eq(users.status, 'active')))
    .orderBy(desc(vehicles.createdAt))
    .limit(40);

  // Filter to only builds with at least a photo (visual-first deck)
  const cards: DiscoverCard[] = rows.filter((r) => r.photoUrl) as DiscoverCard[];

  return (
    <main
      style={{
        minHeight: '100dvh',
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(255,42,42,0.10), transparent 50%), #05060a',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '24px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <header style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.4em',
              color: '#ff3030',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            DISCOVER
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Swipe through the gallery
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(245,246,247,0.6)',
              marginTop: 6,
            }}
          >
            Swipe right to save · left to pass · tap to open
          </p>
        </header>

        <SwipeDeck cards={cards} />
      </div>
    </main>
  );
}
