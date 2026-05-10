// app/market/offers/page.tsx — my outgoing offers (buyer side).

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getAuthContext } from '@/lib/auth/gates';
import { getOffersFromBuyer } from '@/lib/market/queries';
import { BuyerOfferList } from '@/components/market/OfferList';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My offers' };

export default async function OffersPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const offers = await getOffersFromBuyer(ctx.userId);

  // Group by listing for tidy display
  const byListing = new Map<
    string,
    { title: string; status: string; offers: any[] }
  >();
  for (const r of offers) {
    const e = byListing.get(r.offer.listingId);
    if (!e) {
      byListing.set(r.offer.listingId, {
        title: r.listingTitle,
        status: r.listingStatus,
        offers: [r.offer],
      });
    } else {
      e.offers.push(r.offer);
    }
  }

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 880,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: '#ff3030',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 700,
        }}
      >
        UNDERGROUND · MY OFFERS
      </div>
      <h1 style={{ fontSize: 28, margin: '4px 0 22px' }}>Offers you've sent</h1>

      {byListing.size === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'rgba(245,246,247,0.55)',
            background: 'rgba(20,22,30,0.4)',
            border: '1px dashed rgba(255,255,255,0.12)',
            borderRadius: 12,
          }}
        >
          You haven't sent any offers yet.{' '}
          <Link href="/market" style={{ color: '#ff5252' }}>
            Browse the market →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {Array.from(byListing.entries()).map(([listingId, group]) => (
            <section
              key={listingId}
              style={{
                padding: 18,
                background: 'rgba(20,22,30,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Link
                  href={`/market/${listingId}`}
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#fff',
                    textDecoration: 'none',
                  }}
                >
                  {group.title}
                </Link>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    color: group.status === 'active' ? '#7ee787' : '#888',
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontWeight: 700,
                  }}
                >
                  {group.status.toUpperCase()}
                </span>
              </div>
              <BuyerOfferList offers={group.offers} />
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
