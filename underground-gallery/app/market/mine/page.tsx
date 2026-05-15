// app/market/mine/page.tsx — seller dashboard.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getAuthContext } from '@/lib/auth/gates';
import { getMyListings } from '@/lib/market/queries';
import { MarketCard } from '@/components/market/MarketCard';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My listings' };

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Drafts' },
  { key: 'sold', label: 'Sold' },
  { key: 'expired', label: 'Expired' },
  { key: 'removed', label: 'Removed' },
] as const;

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const sp = await searchParams;
  const all = await getMyListings(ctx.userId);
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? 'active';
  const filtered = all.filter((l) => l.status === tab);

  const counts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = all.filter((l) => l.status === t.key).length;
    return acc;
  }, {});

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 1200,
        margin: '0 auto',
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 22,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.4em',
              color: colors.accent,
              fontFamily: fonts.mono,
              fontWeight: 700,
            }}
          >
            ∕∕ UNDERGROUND · MY LISTINGS
          </div>
          <h1 style={{ fontSize: 28, margin: '4px 0' }}>What you're selling</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
            {all.length.toLocaleString()} listing{all.length === 1 ? '' : 's'} total ·
            {' '}
            <Link href="/market/messages" style={{ color: colors.accent }}>
              View buyer messages →
            </Link>
          </p>
        </div>
        <Link href="/market/new" className="ug-btn ug-btn-primary ug-pill">
          + LIST SOMETHING
        </Link>
      </header>

      <nav
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 22,
          fontFamily: fonts.mono,
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/market/mine?tab=${t.key}`}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                fontSize: 10,
                letterSpacing: '0.22em',
                fontWeight: 700,
                textDecoration: 'none',
                background: active ? colors.accentSoft : 'rgba(255,255,255,0.04)',
                color: active ? colors.accent : colors.textMuted,
                border: active ? `1px solid ${colors.accentBorder}` : '1px solid transparent',
              }}
            >
              {t.label.toUpperCase()} ({counts[t.key] ?? 0})
            </Link>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <div
          className="ug-card"
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            color: colors.textMuted,
          }}
        >
          <div style={{ fontSize: 16, marginBottom: 6, color: colors.text }}>
            Nothing in {TABS.find((t) => t.key === tab)?.label}.
          </div>
          {tab === 'active' && (
            <div>
              <Link href="/market/new" style={{ color: colors.accent }}>
                List something →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((l) => (
            <div key={l.id} style={{ position: 'relative' }}>
              <MarketCard listing={l} />
              <Link
                href={`/market/${l.id}/edit`}
                className="ug-btn ug-btn-ghost ug-pill"
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                }}
              >
                EDIT
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
