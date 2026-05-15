// app/market/parts/page.tsx — parts-only browse view.

import { Metadata } from 'next';
import { browseListings } from '@/lib/market/queries';
import { MarketSearchBar } from '@/components/market/MarketSearchBar';
import { MarketFilters } from '@/components/market/MarketFilters';
import { MarketGrid } from '@/components/market/MarketGrid';
import { colors, fonts } from '@/lib/design';

export const metadata: Metadata = { title: 'Parts for sale' };
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

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = {
    type: 'part' as const,
    q: pickStr(sp, 'q'),
    category: pickStr(sp, 'category') as any,
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
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <header style={{ marginBottom: 32, maxWidth: 760 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.4em',
            color: colors.accent,
            fontFamily: fonts.mono,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          ∕∕ UNDERGROUND · PARTS
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
          Parts for sale
        </h1>
        <p style={{ fontSize: 17, color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
          {total.toLocaleString()} part{total === 1 ? '' : 's'} from members — ready to bolt on, no platform fees.
        </p>
      </header>

      <MarketSearchBar type="part" />

      <div className="ug-market-grid-browse">
        <div>
          <MarketFilters type="part" />
        </div>
        <div>
          <MarketGrid
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            basePath="/market/parts"
            searchParams={flat}
          />
        </div>
      </div>
    </main>
  );
}
