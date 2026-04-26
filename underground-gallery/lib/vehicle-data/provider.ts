// lib/vehicle-data/provider.ts
//
// Abstraction over vehicle-specs data sources. Multiple providers can be
// stacked in priority order — first one to return a result wins.
//
// Current order:
//   1. Local DB cache (vehicle_specs table)
//   2. NHTSA vPIC (free, US-government, gives Y/M/M and VIN decode but
//      no horsepower / torque / weight)
//   3. Manual fallback (user fills in missing fields)
//
// Future layers can drop in here without changing call sites — e.g.,
// CarAPI.app or Auto-Data as paid providers above NHTSA.

export type Year = number;

export type Make = {
  id: string;
  name: string;
};

export type Model = {
  id: string;
  name: string;
  makeId: string;
};

export type Trim = {
  /** Provider-specific key. Combine with year/make/model for our cache. */
  key: string;
  name: string;
  /** May be partial — fill missing fields manually if absent. */
  specs?: Partial<ProviderSpecs>;
};

export type ProviderSpecs = {
  bodyStyle: string | null;
  engine: string | null;
  displacement: string | null;
  aspiration: string | null;
  fuelType: string | null;
  transmission: string | null;
  drivetrain: string | null;
  stockHp: number | null;
  stockTorque: number | null;
  curbWeight: number | null;
  zeroToSixty: number | null;
  quarterMile: number | null;
  topSpeed: number | null;
};

export type VinDecodeResult = {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyStyle: string | null;
  engine: string | null;
  displacement: string | null;
  fuelType: string | null;
  transmission: string | null;
  drivetrain: string | null;
};

export interface VehicleDataProvider {
  /** Display name. */
  name: string;
  /** Minimum confidence the provider can offer. */
  confidence: 'verified' | 'community' | 'estimated' | 'unverified';
  /** Cheap probe — does this provider have anything for this Y/M/M? */
  hasYearMakeModel?: (year: number, make: string, model: string) => Promise<boolean>;

  listYears?: () => Promise<Year[]>;
  listMakes?: (year: Year) => Promise<Make[]>;
  listModels?: (year: Year, make: string) => Promise<Model[]>;
  listTrims?: (year: Year, make: string, model: string) => Promise<Trim[]>;
  getSpecs?: (year: Year, make: string, model: string, trim: string) => Promise<ProviderSpecs | null>;
  decodeVin?: (vin: string) => Promise<VinDecodeResult | null>;
}
