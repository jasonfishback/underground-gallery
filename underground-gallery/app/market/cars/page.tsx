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
        padding: '40px 24px 80px',
        maxWidth: 1320,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: 32, maxWidth: 760 }}>
        <div style={accentLabelStyle}>UNDERGROUND · CARS</div>
        <h1
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            margin: '12px 0 14px',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
          }}
        >
          Cars for sale
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(245,246,247,0.65)', margin: 0, lineHeight: 1.5 }}>
          {total.toLocaleString()} car{total === 1 ? '' : 's'} listed by members of the gallery.
        </p>
      </header>

      <MarketSearchBar type="car" />

      <div className="ug-market-grid-browse">
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
  marginBottom: 4,
};
