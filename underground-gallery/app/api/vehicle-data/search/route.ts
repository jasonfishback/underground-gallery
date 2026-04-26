// ============================================================================
// app/api/vehicle-data/search/route.ts
// NHTSA fallback. Called by AddCarWizard typeahead when the catalog returns
// zero hits. Parses "2015 bmw m3" -> {year, make, model} and asks NHTSA.
// NHTSA gives Y/M/M but no HP — that's fine, manual fillin handles HP later.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NhtsaResult = {
  source: "nhtsa";
  year: number;
  make: string;
  model: string;
  label: string;
};

const YEAR_RE = /\b(19|20)\d{2}\b/;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] as NhtsaResult[] });
  }

  // Pull year if present
  const yearMatch = q.match(YEAR_RE);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

  // Tokens minus year, e.g. "bmw m3"
  const rest = q.replace(YEAR_RE, "").trim();
  const tokens = rest.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, results: [] as NhtsaResult[] });
  }

  // Strategy: first token = make. Remaining = model substring filter.
  const makeGuess = tokens[0];
  const modelFilter = tokens.slice(1).join(" ");

  try {
    // NHTSA endpoint: GetModelsForMake (returns all models for a make)
    // If a year is provided, GetModelsForMakeYear narrows it.
    const nhtsaUrl = year
      ? `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(
          makeGuess,
        )}/modelyear/${year}?format=json`
      : `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(
          makeGuess,
        )}?format=json`;

    const res = await fetch(nhtsaUrl, {
      headers: { Accept: "application/json" },
      // 5s timeout via AbortController
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: true, results: [] as NhtsaResult[] });
    }

    const data = (await res.json()) as {
      Results: Array<{ Make_Name: string; Model_Name: string }>;
    };

    let models = data.Results ?? [];

    // Filter by remaining tokens against Model_Name
    if (modelFilter) {
      const lc = modelFilter.toLowerCase();
      models = models.filter((m) => m.Model_Name.toLowerCase().includes(lc));
    }

    // Dedup + cap
    const seen = new Set<string>();
    const results: NhtsaResult[] = [];
    for (const m of models) {
      const key = `${m.Make_Name}|${m.Model_Name}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const finalYear = year ?? new Date().getFullYear();
      const make = titleCase(m.Make_Name);
      const model = m.Model_Name;
      results.push({
        source: "nhtsa",
        year: finalYear,
        make,
        model,
        label: `${finalYear} ${make} ${model}`,
      });
      if (results.length >= 8) break;
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[/api/vehicle-data/search] NHTSA failed:", err);
    return NextResponse.json({ ok: true, results: [] as NhtsaResult[] });
  }
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
