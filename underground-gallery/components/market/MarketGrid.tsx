// components/market/MarketGrid.tsx
//
// Grid of MarketCards + a pagination footer. Server-friendly (no hooks).

import Link from 'next/link';
import { MarketCard } from './MarketCard';
import type { ListingCard } from '@/lib/market/queries';

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
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          color: 'rgba(245,246,247,0.55)',
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          background: 'rgba(20,22,30,0.4)',
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 16, marginBottom: 6, color: '#fff' }}>Nothing here yet.</div>
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
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="ug-btn">
              ← Prev
            </Link>
          )}
          <span
            style={{
              padding: '8px 14px',
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'rgba(245,246,247,0.6)',
            }}
          >
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="ug-btn">
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
