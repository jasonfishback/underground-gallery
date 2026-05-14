// app/market/page.tsx — Cars-and-Bids style browse (all listings).

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
        padding: '40px 24px 80px',
        maxWidth: 1320,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: 32, maxWidth: 760 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.4em',
            color: '#ff3030',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          UNDERGROUND · MARKET
        </div>
        <h1
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            margin: '0 0 14px',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
          }}
        >
          For sale among members
        </h1>
        <p
          style={{
            fontSize: 17,
            color: 'rgba(245,246,247,0.65)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {total.toLocaleString()} listing{total === 1 ? '' : 's'} live ·
          buyer-and-seller direct, contact only, zero platform fees.
        </p>
      </header>

      <MarketSearchBar />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 280px) 1fr',
          gap: 32,
          alignItems: 'start',
          marginTop: 8,
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
