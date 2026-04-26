// lib/vehicle-data/nhtsa.ts
//
// NHTSA Vehicle API (vPIC). Free, government-run, no API key required.
// Docs: https://vpic.nhtsa.dot.gov/api/
//
// What we get:
//   - Year/Make/Model lists                    ✓ (cheap, fast)
//   - VIN decode (engine, fuel, drivetrain)    ✓ (very useful)
//   - Horsepower / torque / curb weight        ✗ (not in this dataset)
//
// Strategy: use NHTSA for the picker chain (year → make → model) and for
// VIN decode. Fall through to manual entry for HP/torque/weight, which
// users contribute back to our `vehicle_specs` cache for future users.

import type {
  VehicleDataProvider,
  Make,
  Model,
  Trim,
  ProviderSpecs,
  VinDecodeResult,
} from './provider';

const BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

type NhtsaResults<T> = { Count: number; Message: string; Results: T[] };

async function nhtsaFetch<T>(path: string): Promise<NhtsaResults<T> | null> {
  try {
    const res = await fetch(`${BASE}${path}?format=json`, {
      // NHTSA is well-behaved — 24h cache is fine for static data.
      // `next.revalidate` is a Next.js fetch extension; cast for isolated typecheck.
      next: { revalidate: 86400 },
    } as RequestInit);
    if (!res.ok) return null;
    return (await res.json()) as NhtsaResults<T>;
  } catch (err) {
    console.error('[nhtsa] fetch failed', err);
    return null;
  }
}

export const nhtsaProvider: VehicleDataProvider = {
  name: 'nhtsa',
  confidence: 'community',

  async listYears() {
    // NHTSA doesn't have a "list of years" endpoint. Generate a sensible
    // range — most enthusiast vehicles fall between 1990 and current+1.
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current + 1; y >= 1990; y--) years.push(y);
    return years;
  },

  async listMakes(year) {
    type Row = { Make_ID: number; Make_Name: string };
    const r = await nhtsaFetch<Row>(`/GetMakesForVehicleType/car`);
    if (!r) return [];
    return r.Results.map((row) => ({
      id: String(row.Make_ID),
      name: row.Make_Name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  },

  async listModels(year, make) {
    type Row = { Model_ID: number; Model_Name: string; Make_ID: number };
    const r = await nhtsaFetch<Row>(
      `/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}`,
    );
    if (!r) return [];
    return r.Results.map((row) => ({
      id: String(row.Model_ID),
      name: row.Model_Name,
      makeId: String(row.Make_ID),
    })).sort((a, b) => a.name.localeCompare(b.name));
  },

  async listTrims(year, make, model) {
    // NHTSA doesn't expose trims directly via the public API. Return an
    // empty list — UI offers a "Base" placeholder + free-text fallback.
    return [];
  },

  async getSpecs() {
    // NHTSA doesn't return curb weight, hp, or torque in a usable form
    // for most vehicles. Return null — the manual-entry flow takes over.
    return null;
  },

  async decodeVin(vin) {
    if (!vin || vin.length < 11) return null;
    type VinRow = { Variable: string; Value: string | null; ValueId: string | null };
    const r = await nhtsaFetch<VinRow>(`/DecodeVin/${encodeURIComponent(vin)}`);
    if (!r) return null;

    const lookup = (label: string): string | null => {
      const row = r.Results.find((x) => x.Variable === label);
      const v = row?.Value;
      return v && v !== 'Not Applicable' && v.trim() ? v : null;
    };

    return {
      year: parseInt(lookup('Model Year') ?? '', 10) || null,
      make: lookup('Make'),
      model: lookup('Model'),
      trim: lookup('Trim') ?? lookup('Series'),
      bodyStyle: lookup('Body Class'),
      engine: lookup('Engine Model') ?? lookup('Engine Configuration'),
      displacement: lookup('Displacement (L)') ? `${lookup('Displacement (L)')}L` : null,
      fuelType: lookup('Fuel Type - Primary'),
      transmission: lookup('Transmission Style'),
      drivetrain: lookup('Drive Type'),
    };
  },
};
