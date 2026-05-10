// app/market/cars/page.tsx — cars-only browse view.

import { Metadata } from 'next';
import { browseListings } from '@/lib/market/queries';
import { MarketSearchBar } from '@/components/market/MarketSearchBar';
import { MarketFilters } from '@/components/market/MarketFilters';
import { MarketGrid } from '@/components/market/MarketGrid';

export const metadata: Metadata = { title: 'Cars for sale' };
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;
const pickStr = (sp: SearchParams, k: string) => {
  const v = sp[k];
  return Array.isArray(v) ? v[0] : v;
};
const pickNum = (sp: SearchParams, k: string) => {
  const v = pickStr(sp, k);
  return v ? Number(v) : undefined;
};

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = {
    type: 'car' as const,
    q: pickStr(sp, 'q'),
    make: pickStr(sp, 'make'),
    model: pickStr(sp, 'model'),
    yearMin: pickNum(sp, 'yearMin'),
    yearMax: pickNum(sp, 'yearMax'),
    priceMin: pickNum(sp, 'priceMin'),
    priceMax: pickNum(sp, 'priceMax'),
    condition: pickStr(sp, 'condition') as any,
    sort: (pickStr(sp, 'sort') as any) || 'newest',
    page: pickNum(sp, 'page') ?? 1,
    pageSize: 24,
  };

  const { rows, total, page, pageSize } = await browseListings(filters);
  const flat: Record<string, string | undefined> = {};
  for (const k of Object.keys(sp)) flat[k] = pickStr(sp, k);

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
        <div style={accentLabelStyle}>UNDERGROUND · CARS</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '6px 0 4px' }}>Cars for sale</h1>
        <p style={{ fontSize: 14, color: 'rgba(245,246,247,0.55)', margin: 0 }}>
          {total.toLocaleString()} car{total === 1 ? '' : 's'} listed by members.
        </p>
      </header>

      <MarketSearchBar type="car" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: 22, alignItems: 'start' }}>
        <div>
          <MarketFilters type="car" />
        </div>
        <div>
          <MarketGrid
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            basePath="/market/cars"
            searchParams={flat}
          />
        </div>
      </div>
    </main>
  );
}

const accentLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.4em',
  color: '#ff3030',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 700,
};
