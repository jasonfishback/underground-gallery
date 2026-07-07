// app/api/market/browse/route.ts
//
// JSON feed for the marketplace infinite scroll. Same filters as the
// server-rendered browse pages; MarketGrid fetches page 2+ from here.

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/gates';
import { browseListings } from '@/lib/market/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ctx.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const str = (k: string) => sp.get(k) ?? undefined;
  const num = (k: string) => {
    const v = sp.get(k);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  try {
    const { rows, total, page, pageSize } = await browseListings({
      type: str('type') as any,
      q: str('q'),
      category: str('category') as any,
      make: str('make'),
      model: str('model'),
      yearMin: num('yearMin'),
      yearMax: num('yearMax'),
      priceMin: num('priceMin'),
      priceMax: num('priceMax'),
      condition: str('condition') as any,
      sort: (str('sort') as any) || 'newest',
      page: num('page') ?? 1,
      pageSize: 24,
    });
    return NextResponse.json({ rows, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: 'Bad filters' }, { status: 400 });
  }
}
