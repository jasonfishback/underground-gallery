// components/market/MarketGrid.tsx
//
// Grid of MarketCards + a pagination footer. Server-friendly (no hooks).

import Link from 'next/link';
import { MarketCard } from './MarketCard';
import type { ListingCard } from '@/lib/market/queries';
import { colors, fonts } from '@/lib/design';

export function MarketGrid({
  rows,
  total,
  page,
  pageSize,
  basePath,
  searchParams,
  emptyHint,
}: {
  rows: ListingCard[];
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  emptyHint?: string;
}) {
  if (rows.length === 0) {
    return (
      <div
        className="ug-card"
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          color: colors.textMuted,
          fontFamily: fonts.sans,
        }}
      >
        <div style={{ fontSize: 16, marginBottom: 6, color: colors.text }}>Nothing here yet.</div>
        <div style={{ fontSize: 13 }}>
          {emptyHint ?? 'Try clearing filters or check back soon.'}
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(p: number) {
    const next = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => !!v) as [string, string][],
    );
    if (p === 1) next.delete('page');
    else next.set('page', String(p));
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {rows.map((r) => (
          <MarketCard key={r.id} listing={r} />
        ))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            marginTop: 24,
            fontFamily: fonts.mono,
          }}
        >
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="ug-btn ug-btn-ghost">
              ← Prev
            </Link>
          )}
          <span
            style={{
              padding: '8px 14px',
              fontSize: 11,
              letterSpacing: '0.18em',
              color: colors.textMuted,
            }}
          >
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="ug-btn ug-btn-ghost">
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
