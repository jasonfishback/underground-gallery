// lib/vehicle-data/index.ts
//
// Exposes the high-level vehicle-data API used by route handlers and
// server actions. Internally it composes provider implementations in
// priority order:
//   1. cache  (our DB)
//   2. nhtsa  (free, public)
// More providers (CarAPI.app, Auto-Data) can be inserted later between
// cache and nhtsa without touching call sites.

import { cacheProvider } from './cache';
import { nhtsaProvider } from './nhtsa';
import type { VehicleDataProvider, Make, Model, Trim, ProviderSpecs, VinDecodeResult } from './provider';

const providers: VehicleDataProvider[] = [cacheProvider, nhtsaProvider];

export async function listYears(): Promise<number[]> {
  for (const p of providers) {
    if (p.listYears) {
      const r = await p.listYears();
      if (r.length) return r;
    }
  }
  return [];
}

export async function listMakes(year: number): Promise<Make[]> {
  for (const p of providers) {
    if (p.listMakes) {
      const r = await p.listMakes(year);
      if (r.length) return r;
    }
  }
  return [];
}

export async function listModels(year: number, make: string): Promise<Model[]> {
  for (const p of providers) {
    if (p.listModels) {
      const r = await p.listModels(year, make);
      if (r.length) return r;
    }
  }
  return [];
}

export async function listTrims(year: number, make: string, model: string): Promise<Trim[]> {
  // Special case: union cache + nhtsa results so seed/community trims
  // appear alongside provider-discovered trims if any.
  const seen = new Set<string>();
  const out: Trim[] = [];
  for (const p of providers) {
    if (!p.listTrims) continue;
    const r = await p.listTrims(year, make, model);
    for (const trim of r) {
      const key = trim.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(trim);
      }
    }
  }
  return out;
}

export async function getSpecs(
  year: number,
  make: string,
  model: string,
  trim: string,
): Promise<{ specs: ProviderSpecs; provider: string } | null> {
  for (const p of providers) {
    if (!p.getSpecs) continue;
    const specs = await p.getSpecs(year, make, model, trim);
    if (specs) return { specs, provider: p.name };
  }
  return null;
}

export async function decodeVin(vin: string): Promise<{ data: VinDecodeResult; provider: string } | null> {
  for (const p of providers) {
    if (!p.decodeVin) continue;
    const data = await p.decodeVin(vin);
    if (data) return { data, provider: p.name };
  }
  return null;
}
