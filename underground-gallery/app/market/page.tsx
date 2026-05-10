// app/market/page.tsx — browse all listings (cars + parts).

import { Metadata } from 'next';
import { browseListings } from '@/lib/market/queries';
import { MarketSearchBar } from '@/components/market/MarketSearchBar';
import { MarketFilters } from '@/components/market/MarketFilters';
import { MarketGrid } from '@/components/market/MarketGrid';

export const metadata: Metadata = {
  title: 'Market',
  description: 'Members-only classifieds: cars, parts, and pieces from the Underground.',
};

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function pickStr(sp: SearchParams, k: string) {
  const v = sp[k];
  return Array.isArray(v) ? v[0] : v;
}
function pickNum(sp: SearchParams, k: string) {
  const v = pickStr(sp, k);
  return v ? Number(v) : undefined;
}

export default async function MarketBrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = {
    q: pickStr(sp, 'q'),
    condition: pickStr(sp, 'condition') as any,
    priceMin: pickNum(sp, 'priceMin'),
    priceMax: pickNum(sp, 'priceMax'),
    sort: (pickStr(sp, 'sort') as any) || 'newest',
    page: pickNum(sp, 'page') ?? 1,
    pageSize: 24,
  };

  const { rows, total, page, pageSize } = await browseListings(filters);

  const flatSearchParams: Record<string, string | undefined> = {};
  for (const k of Object.keys(sp)) flatSearchParams[k] = pickStr(sp, k);

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 1280,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.4em',
            color: '#ff3030',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontWeight: 700,
          }}
        >
          UNDERGROUND · MARKET
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '6px 0 4px' }}>
          For sale among members
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(245,246,247,0.55)', margin: 0 }}>
          {total.toLocaleString()} listing{total === 1 ? '' : 's'} live.
          Contact-only. No platform fees.
        </p>
      </header>

      <MarketSearchBar />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 280px) 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <div>
          <MarketFilters />
        </div>
        <div>
          <MarketGrid
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            basePath="/market"
            searchParams={flatSearchParams}
          />
        </div>
      </div>
    </main>
  );
}
