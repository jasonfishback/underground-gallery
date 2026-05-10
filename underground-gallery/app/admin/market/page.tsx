// app/admin/market/page.tsx
//
// Moderator-only marketplace queue: pending flags + recent listings.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, listings, flags } from '@/lib/db/schema';
import { formatPriceWithType } from '@/lib/market/types';
import { AdminFlagRow } from '@/components/market/AdminFlagRow';
import { AdminListingRow } from '@/components/market/AdminListingRow';

export const dynamic = 'force-dynamic';

export default async function AdminMarketPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin?next=/admin/market');

  const [me] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!me?.isModerator) redirect('/me');

  // Pending flags on listings
  const pendingFlags = await db
    .select({
      flag: flags,
      reporterCallsign: users.callsign,
    })
    .from(flags)
    .leftJoin(users, eq(users.id, flags.reporterId))
    .where(and(eq(flags.subjectType, 'listing'), eq(flags.status, 'pending')))
    .orderBy(desc(flags.createdAt))
    .limit(50);

  // Hydrate the flagged listings
  const flaggedListingIds = Array.from(new Set(pendingFlags.map((f) => f.flag.subjectId)));
  const flaggedListings = flaggedListingIds.length > 0
    ? await db
        .select({
          id: listings.id,
          title: listings.title,
          status: listings.status,
          listingType: listings.listingType,
          sellerId: listings.sellerId,
          priceCents: listings.priceCents,
          priceType: listings.priceType,
          currency: listings.currency,
          sellerCallsign: users.callsign,
        })
        .from(listings)
        .leftJoin(users, eq(users.id, listings.sellerId))
        .where(inArray(listings.id, flaggedListingIds))
    : [];
  const listingMap = new Map(flaggedListings.map((l) => [l.id, l]));

  // Recent listings (any status) for spot-checking
  const recent = await db
    .select({
      id: listings.id,
      title: listings.title,
      status: listings.status,
      listingType: listings.listingType,
      sellerId: listings.sellerId,
      priceCents: listings.priceCents,
      priceType: listings.priceType,
      currency: listings.currency,
      createdAt: listings.createdAt,
      sellerCallsign: users.callsign,
    })
    .from(listings)
    .leftJoin(users, eq(users.id, listings.sellerId))
    .orderBy(desc(listings.createdAt))
    .limit(40);

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 1100,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <Link
          href="/admin"
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'rgba(245,246,247,0.55)',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            textDecoration: 'none',
          }}
        >
          ← ADMIN
        </Link>
      </div>
      <div style={{ fontSize: 11, letterSpacing: '0.4em', color: '#ff3030', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700 }}>
        ADMIN · MARKET
      </div>
      <h1 style={{ fontSize: 28, margin: '4px 0 22px' }}>Marketplace moderation</h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={sectionHeading}>Pending reports ({pendingFlags.length})</h2>
        {pendingFlags.length === 0 ? (
          <p style={{ color: 'rgba(245,246,247,0.55)' }}>No open reports.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingFlags.map((f) => (
              <AdminFlagRow
                key={f.flag.id}
                flagId={f.flag.id}
                listingId={f.flag.subjectId}
                listing={listingMap.get(f.flag.subjectId) ?? null}
                reason={f.flag.reason}
                details={f.flag.details}
                reporterCallsign={f.reporterCallsign}
                createdAt={f.flag.createdAt}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 style={sectionHeading}>Recent listings ({recent.length})</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recent.map((l) => (
            <AdminListingRow
              key={l.id}
              id={l.id}
              title={l.title}
              status={l.status}
              listingType={l.listingType}
              priceLabel={formatPriceWithType(l.priceCents, l.priceType, l.currency)}
              sellerCallsign={l.sellerCallsign}
              createdAt={l.createdAt}
            />
          ))}
        </ul>
      </section>
    </main>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: '0.3em',
  color: 'rgba(245,246,247,0.6)',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 700,
  marginBottom: 12,
  textTransform: 'uppercase',
};
