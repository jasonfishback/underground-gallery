// app/api/vehicle-data/route.ts
//
// REST surface for the vehicle picker. Exposes:
//   GET ?op=years
//   GET ?op=makes&year=YYYY
//   GET ?op=models&year=YYYY&make=NAME
//   GET ?op=trims&year=YYYY&make=NAME&model=NAME
//   GET ?op=specs&year=YYYY&make=NAME&model=NAME&trim=NAME
//   GET ?op=vin&vin=XXXX...
//
// Auth: requires an active, setup-complete user. We don't expose the
// picker to anonymous traffic — this is a private community.

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/gates';
import {
  listYears,
  listMakes,
  listModels,
  listTrims,
  getSpecs,
  decodeVin,
} from '@/lib/vehicle-data';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.status !== 'active') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const op = req.nextUrl.searchParams.get('op');
  const year = parseInt(req.nextUrl.searchParams.get('year') ?? '', 10);
  const make = req.nextUrl.searchParams.get('make') ?? '';
  const model = req.nextUrl.searchParams.get('model') ?? '';
  const trim = req.nextUrl.searchParams.get('trim') ?? '';
  const vin = req.nextUrl.searchParams.get('vin') ?? '';

  try {
    switch (op) {
      case 'years': {
        const years = await listYears();
        return NextResponse.json({ years });
      }
      case 'makes': {
        if (!year) return NextResponse.json({ makes: [] });
        const makes = await listMakes(year);
        return NextResponse.json({ makes });
      }
      case 'models': {
        if (!year || !make) return NextResponse.json({ models: [] });
        const models = await listModels(year, make);
        return NextResponse.json({ models });
      }
      case 'trims': {
        if (!year || !make || !model) return NextResponse.json({ trims: [] });
        const trims = await listTrims(year, make, model);
        return NextResponse.json({ trims });
      }
      case 'specs': {
        if (!year || !make || !model) return NextResponse.json({ specs: null });
        const specs = await getSpecs(year, make, model, trim);
        return NextResponse.json(specs);
      }
      case 'vin': {
        if (!vin) return NextResponse.json({ error: 'VIN required' }, { status: 400 });
        const result = await decodeVin(vin);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Unknown op' }, { status: 400 });
    }
  } catch (err) {
    console.error('[/api/vehicle-data]', err);
    return NextResponse.json({ error: 'Provider error' }, { status: 502 });
  }
}
