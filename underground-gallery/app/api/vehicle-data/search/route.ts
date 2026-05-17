// ============================================================================
// app/api/vehicle-data/search/route.ts
// NHTSA fallback. Called by AddCarWizard typeahead (debounced) when the
// catalog has no hit. Handles three query shapes:
//   "2015 bmw m3"  -> make=bmw, model=m3                (path1)
//   "ford f150"    -> make=ford, model=f150             (path1)
//   "2015 f250"    -> single token; could be model-only -> fan out across
//                     popular makes to find which one owns it    (path2)
//   "mustang"      -> same as above
// path1 and path2 run in parallel; results are merged.
//
// Notes on NHTSA quirks handled here:
//  - Substring match on `make` (asking for "ford" returns "BRADFORD BUILT"
//    etc.) — filtered via `startsWith` on normalized make.
//  - Trailer / manufacturer self-reference rows (Make_Name === Model_Name)
//    are skipped — they're never real consumer vehicles.
//  - Make aliases (mercedes -> mercedes-benz, chevy -> chevrolet, vw ->
//    volkswagen) are expanded before query.
//  - Model match uses digit/letter word boundaries so "f250" doesn't match
//    "CRF250L" mid-string.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type NhtsaResult = {
  source: 'nhtsa';
  year: number;
  make: string;
  model: string;
  label: string;
};

const YEAR_RE = /\b(19|20)\d{2}\b/;

const POPULAR_MAKES = [
  'Ford',
  'Chevrolet',
  'Dodge',
  'Ram',
  'GMC',
  'Jeep',
  'Toyota',
  'Honda',
  'Nissan',
  'Subaru',
  'Mazda',
  'Mitsubishi',
  'Lexus',
  'Acura',
  'Infiniti',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Porsche',
  'Volkswagen',
  'Tesla',
  'Cadillac',
  'Buick',
  'Chrysler',
  'Pontiac',
  'Hyundai',
  'Kia',
];

const MAKE_ALIASES: Record<string, string> = {
  mercedes: 'Mercedes-Benz',
  mb: 'Mercedes-Benz',
  benz: 'Mercedes-Benz',
  chevy: 'Chevrolet',
  vw: 'Volkswagen',
  vdub: 'Volkswagen',
  beemer: 'BMW',
  bimmer: 'BMW',
  caddy: 'Cadillac',
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] as NhtsaResult[] });
  }

  const yearMatch = q.match(YEAR_RE);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

  const rest = q.replace(YEAR_RE, '').trim();
  const tokens = rest.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, results: [] as NhtsaResult[] });
  }

  const makeGuess = MAKE_ALIASES[tokens[0]] ?? tokens[0];
  const modelFilter = tokens.slice(1).join(' ');
  const singleToken = tokens.length === 1;

  try {
    // path1: first token as make. Always runs (cheap when make is real).
    // path2: only when user typed a single token after year — could be a
    // model-only query like "f250" or "mustang"; fan out across popular
    // makes in parallel.
    const [path1, ...fanout] = await Promise.all([
      fetchModels(makeGuess, year),
      ...(singleToken ? POPULAR_MAKES.map((m) => fetchModels(m, year)) : []),
    ]);

    const merged = new Map<string, NhtsaResult>();
    addMatches(merged, path1, modelFilter, year);
    for (const list of fanout) addMatches(merged, list, rest, year);

    return NextResponse.json({
      ok: true,
      results: Array.from(merged.values()).slice(0, 12),
    });
  } catch (err) {
    console.error('[/api/vehicle-data/search] NHTSA failed:', err);
    return NextResponse.json({ ok: true, results: [] as NhtsaResult[] });
  }
}

type NhtsaModel = { Make_Name: string; Model_Name: string };

async function fetchModels(make: string, year?: number): Promise<NhtsaModel[]> {
  const url = year
    ? `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
    : `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { Results: NhtsaModel[] };
    const rows = data.Results ?? [];
    // NHTSA does a substring match on `make`. Filter to rows whose returned
    // Make_Name starts with the requested make (normalized). Keeps
    // "Mercedes-Benz" when asked for "mercedes", drops "Bradford Built"
    // when asked for "ford".
    const needle = norm(make);
    return rows.filter((r) => {
      const got = norm(r.Make_Name);
      if (!got.startsWith(needle)) return false;
      // Drop manufacturer self-reference rows (e.g. trailer companies).
      if (norm(r.Make_Name) === norm(r.Model_Name)) return false;
      // Drop obvious non-vehicle business types.
      const m = r.Make_Name.toLowerCase();
      if (m.includes('trailer') || m.includes('mfg')) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function addMatches(
  out: Map<string, NhtsaResult>,
  models: NhtsaModel[],
  modelFilter: string,
  year: number | undefined,
) {
  const needle = norm(modelFilter);
  for (const m of models) {
    if (needle && !modelHasWordMatch(m.Model_Name, needle)) continue;
    const finalYear = year ?? new Date().getFullYear();
    const make = titleCase(m.Make_Name);
    const model = m.Model_Name;
    const key = `${make}|${model}`;
    if (out.has(key)) continue;
    out.set(key, {
      source: 'nhtsa',
      year: finalYear,
      make,
      model,
      label: `${finalYear} ${make} ${model}`,
    });
  }
}

// True if `needle` (normalized) appears in `haystack` (also normalized) at a
// digit/letter word boundary — prevents "f250" from matching mid-string in
// "CRF250L" while still letting "150" match in "F-150".
function modelHasWordMatch(haystackRaw: string, needle: string): boolean {
  if (!needle) return true;
  const h = norm(haystackRaw);
  let idx = h.indexOf(needle);
  while (idx !== -1) {
    const okLeft = idx === 0 || isCharBoundary(h[idx - 1], h[idx]);
    const end = idx + needle.length;
    const okRight = end === h.length || isCharBoundary(h[end - 1], h[end]);
    if (okLeft && okRight) return true;
    idx = h.indexOf(needle, idx + 1);
  }
  return false;
}

function isCharBoundary(a: string, b: string): boolean {
  const isLetter = (c: string) => c >= 'a' && c <= 'z';
  const isDigit = (c: string) => c >= '0' && c <= '9';
  return (isLetter(a) && isDigit(b)) || (isDigit(a) && isLetter(b));
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}
