// app/market/saved/page.tsx — my watchlist.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getAuthContext } from '@/lib/auth/gates';
import { getWatchedListings } from '@/lib/market/queries';
import { MarketCard } from '@/components/market/MarketCard';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Saved listings' };

export default async function SavedPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const rows = await getWatchedListings(ctx.userId);

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 1280,
        margin: '0 auto',
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, fontFamily: fonts.mono, fontWeight: 700 }}>
        ∕∕ UNDERGROUND · SAVED
      </div>
      <h1 style={{ fontSize: 28, margin: '4px 0 4px' }}>Your watchlist</h1>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 22 }}>
        {rows.length.toLocaleString()} saved listing{rows.length === 1 ? '' : 's'}.
        We'll ping you when one sells.
      </p>

      {rows.length === 0 ? (
        <div
          className="ug-card"
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: colors.textMuted,
          }}
        >
          Nothing saved yet. <Link href="/market" style={{ color: colors.accent }}>Browse the market →</Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {rows.map((l) => (
            <MarketCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </main>
  );
}
