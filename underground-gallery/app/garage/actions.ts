// ============================================================================
// PATCH for app/garage/actions.ts
// Add this server action. Don't replace the whole file — just append this
// inside the existing "use server" block, alongside addCarFromSpec etc.
// ============================================================================

import { sql, ilike, or, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicleSpecs } from "@/lib/db/schema";

export type SpecSearchResult = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  bodyStyle: string | null;
  hpStock: number | null;
  source: "catalog";
  label: string; // e.g. "2015 BMW M3 Sedan"
};

/**
 * searchVehicleSpecs
 * Token-based fuzzy search over the seeded vehicle_specs table.
 * Splits the query into tokens (e.g. "2015 bmw m3" -> ["2015", "bmw", "m3"])
 * and requires every token to match at least one of: year, make, model, trim.
 * Returns top 8 ordered by year desc.
 */
export async function searchVehicleSpecs(
  rawQuery: string,
): Promise<{ ok: true; results: SpecSearchResult[] } | { ok: false; error: string }> {
  "use server";

  const query = (rawQuery ?? "").trim();
  if (query.length < 2) {
    return { ok: true, results: [] };
  }

  // Split on whitespace, drop empties, lowercase.
  const tokens = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6); // cap to avoid pathological queries

  if (tokens.length === 0) {
    return { ok: true, results: [] };
  }

  try {
    // For each token, build (year::text ILIKE %tok% OR make ILIKE %tok% OR model ILIKE %tok% OR trim ILIKE %tok%)
    // Then AND them together so all tokens must match somewhere.
    const tokenConditions = tokens.map((tok) => {
      const pattern = `%${tok}%`;
      return or(
        sql`${vehicleSpecs.year}::text ILIKE ${pattern}`,
        ilike(vehicleSpecs.make, pattern),
        ilike(vehicleSpecs.model, pattern),
        ilike(sql`COALESCE(${vehicleSpecs.trim}, '')`, pattern),
      );
    });

    const rows = await db
      .select({
        id: vehicleSpecs.id,
        year: vehicleSpecs.year,
        make: vehicleSpecs.make,
        model: vehicleSpecs.model,
        trim: vehicleSpecs.trim,
        bodyStyle: vehicleSpecs.bodyStyle,
        hpStock: vehicleSpecs.hpStock,
      })
      .from(vehicleSpecs)
      .where(and(...tokenConditions))
      .orderBy(sql`${vehicleSpecs.year} DESC`)
      .limit(8);

    const results: SpecSearchResult[] = rows.map((r) => ({
      id: r.id,
      year: r.year,
      make: r.make,
      model: r.model,
      trim: r.trim,
      bodyStyle: r.bodyStyle,
      hpStock: r.hpStock,
      source: "catalog" as const,
      label: [r.year, r.make, r.model, r.trim].filter(Boolean).join(" "),
    }));

    return { ok: true, results };
  } catch (err) {
    console.error("[searchVehicleSpecs] failed:", err);
    return { ok: false, error: "Search failed. Try again." };
  }
}
