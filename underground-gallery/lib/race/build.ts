// lib/race/build.ts
//
// Merges a vehicle's stock specs + installed mods into a single RaceCar
// suitable for passing to the race calculator. Pure function.

import type { RaceCar, Drivetrain, Transmission, TireType } from './calculator';
import { rawQuarterMile, rawZeroToSixty, rawTopSpeed } from './calculator';
import {
  isScalablePowerMod,
  platformRelativeHpGain,
  platformRelativeTorqueGain,
  type AspirationLike,
} from './mod-scaling';

export type StockSpecs = {
  hp: number | null;
  torque: number | null;
  weight: number | null;
  drivetrain: string | null;
  transmission: string | null;
  // Optional: engine aspiration + published factory performance. When present,
  // aspiration drives platform-relative mod scaling and the factory times
  // calibrate this car's estimates to reality.
  aspiration?: string | null;
  zeroToSixty?: number | null;
  quarterMile?: number | null;
  topSpeed?: number | null;
};

export type Mod = {
  hpGain: number | null;
  torqueGain: number | null;
  weightChange: number | null;
  tractionModifier: number | null;
  launchModifier: number | null;
  shiftModifier: number | null;
  handlingModifier: number | null;
  // Optional catalog linkage — enables platform-relative power scaling for
  // catalog power mods the user hasn't hand-tuned.
  modCatalogId?: string | null;
  catalogDefaultHp?: number | null;
};

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export type VehicleOverrides = {
  currentHpOverride: number | null;
  currentTorqueOverride: number | null;
  currentWeightOverride: number | null;
  drivetrainOverride: string | null;
  transmissionOverride: string | null;
  tireType: string | null;
  driverSkill: number | null;
};

export type BuildSummary = {
  stockHp: number;
  stockTorque: number;
  stockWeight: number;
  currentHp: number;
  currentTorque: number;
  currentWeight: number;
  totalHpGain: number;
  totalTorqueGain: number;
  totalWeightChange: number;
  powerToWeight: number;     // current
  torqueToWeight: number;    // current
  drivetrain: Drivetrain;
  transmission: Transmission;
  tireType: TireType;
  raceCar: RaceCar;          // ready to feed into calculator
};

const DRIVETRAIN_SET = new Set<Drivetrain>(['AWD', 'RWD', 'FWD', '4WD', 'UNKNOWN']);
const TRANSMISSION_SET = new Set<Transmission>(['Manual', 'Auto', 'DCT', 'CVT', 'UNKNOWN']);
const TIRE_SET = new Set<TireType>(['DragRadial', 'Performance', 'AllSeason', 'Eco', 'Unknown']);

function normalizeDrivetrain(s: string | null): Drivetrain {
  if (!s) return 'UNKNOWN';
  const upper = s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (upper === 'AWD' || upper === 'ALLWHEELDRIVE') return 'AWD';
  if (upper === 'RWD' || upper === 'REARWHEELDRIVE') return 'RWD';
  if (upper === 'FWD' || upper === 'FRONTWHEELDRIVE') return 'FWD';
  if (upper === '4WD' || upper === 'FOURWHEELDRIVE') return '4WD';
  return DRIVETRAIN_SET.has(s as Drivetrain) ? (s as Drivetrain) : 'UNKNOWN';
}

function normalizeTransmission(s: string | null): Transmission {
  if (!s) return 'UNKNOWN';
  if (TRANSMISSION_SET.has(s as Transmission)) return s as Transmission;
  // Tolerate common variants from API data
  const lower = s.toLowerCase();
  if (lower.includes('manual')) return 'Manual';
  if (lower.includes('dct') || lower.includes('dual clutch') || lower.includes('dual-clutch')) return 'DCT';
  if (lower.includes('cvt')) return 'CVT';
  if (lower.includes('auto')) return 'Auto';
  return 'UNKNOWN';
}

function normalizeTireType(s: string | null): TireType {
  if (!s) return 'Unknown';
  return TIRE_SET.has(s as TireType) ? (s as TireType) : 'Unknown';
}

/**
 * Compute the final spec sheet from stock + mods + per-vehicle overrides.
 * The override fields take precedence (e.g., a dyno result overrides
 * stock + mod-gain math).
 */
export function calculateBuild(
  label: string,
  stock: StockSpecs,
  mods: Mod[],
  overrides: VehicleOverrides,
): BuildSummary {
  const stockHp = stock.hp ?? 0;
  const stockTorque = stock.torque ?? 0;
  const stockWeight = stock.weight ?? 0;
  const aspiration = (stock.aspiration ?? null) as AspirationLike;

  // Sum mod contributions ONCE (callers pass raw stock, not pre-built specs).
  // Catalog power mods left at their default gain are rescaled to a percentage
  // of this engine's stock power (platform-relative); hand-tuned values and
  // non-power mods pass through unchanged.
  let totalHpGain = 0;
  let totalTorqueGain = 0;
  let totalWeightChange = 0;
  const modBonuses = { traction: 0, launch: 0, shift: 0, handling: 0 };

  for (const m of mods) {
    const catDefault = m.catalogDefaultHp ?? null;
    const storedHp = m.hpGain;
    const flatHp = storedHp ?? catDefault ?? 0;

    // Rescale only when it's a catalog power mod the user hasn't customized.
    const untouched =
      storedHp == null || (catDefault != null && storedHp === catDefault);
    const scalable = isScalablePowerMod(m.modCatalogId) && untouched;

    const hpGain = scalable
      ? platformRelativeHpGain(m.modCatalogId, stockHp, aspiration, flatHp)
      : flatHp;

    const storedTq = m.torqueGain;
    const tqGain = scalable
      ? platformRelativeTorqueGain(hpGain, aspiration)
      : storedTq != null && storedTq !== 0
        ? storedTq
        : Math.round(hpGain * 0.9);

    totalHpGain += hpGain;
    totalTorqueGain += tqGain;
    totalWeightChange += m.weightChange ?? 0;
    modBonuses.traction += m.tractionModifier ?? 0;
    modBonuses.launch += m.launchModifier ?? 0;
    modBonuses.shift += m.shiftModifier ?? 0;
    modBonuses.handling += m.handlingModifier ?? 0;
  }

  // Apply overrides if present, else stock + mods
  const currentHp = overrides.currentHpOverride ?? (stockHp + totalHpGain);
  const currentTorque = overrides.currentTorqueOverride ?? (stockTorque + totalTorqueGain);
  const currentWeight = overrides.currentWeightOverride ?? (stockWeight + totalWeightChange);

  const drivetrain = normalizeDrivetrain(overrides.drivetrainOverride ?? stock.drivetrain);
  const transmission = normalizeTransmission(overrides.transmissionOverride ?? stock.transmission);
  const tireType = normalizeTireType(overrides.tireType);

  // ── Factory calibration ──────────────────────────────────────────────────
  // Anchor this car's estimates to its real published numbers. We measure how
  // far the raw formula is off for the BONE-STOCK car, then carry that
  // correction onto the (possibly modded) estimate. A stock car reports its
  // real factory time; mods scale from that true baseline.
  const calib: NonNullable<RaceCar['calib']> = {};
  if (stockHp > 0 && stockWeight > 0) {
    const stockRef: RaceCar = {
      label,
      hp: stockHp,
      torque: stockTorque,
      weight: stockWeight,
      drivetrain,
      transmission,
      tireType: 'Performance', // factory tests run on performance/summer tires
      driverSkill: 5,
      modBonuses: {},
    };
    if (stock.quarterMile && stock.quarterMile > 0) {
      const raw = rawQuarterMile(stockRef);
      if (raw > 0) calib.et = clamp(stock.quarterMile / raw, 0.75, 1.35);
    }
    if (stock.zeroToSixty && stock.zeroToSixty > 0) {
      const raw = rawZeroToSixty(stockRef);
      if (raw > 0) calib.z60 = clamp(stock.zeroToSixty / raw, 0.7, 1.4);
    }
    if (stock.topSpeed && stock.topSpeed > 0) {
      const raw = rawTopSpeed(stockRef);
      if (raw > 0) calib.top = clamp(stock.topSpeed / raw, 0.7, 1.4);
    }
  }

  const raceCar: RaceCar = {
    label,
    hp: currentHp,
    torque: currentTorque,
    weight: currentWeight,
    drivetrain,
    transmission,
    tireType,
    driverSkill: overrides.driverSkill ?? 5,
    modBonuses,
    calib,
  };

  return {
    stockHp,
    stockTorque,
    stockWeight,
    currentHp,
    currentTorque,
    currentWeight,
    totalHpGain,
    totalTorqueGain,
    totalWeightChange,
    powerToWeight: currentWeight > 0 ? currentHp / currentWeight : 0,
    torqueToWeight: currentWeight > 0 ? currentTorque / currentWeight : 0,
    drivetrain,
    transmission,
    tireType,
    raceCar,
  };
}
