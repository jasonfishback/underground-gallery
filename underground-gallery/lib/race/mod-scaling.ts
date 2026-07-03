// lib/race/mod-scaling.ts
//
// Platform-relative power gains. A "Stage 1 tune" is not a flat +50 hp on
// every car — it's roughly a *percentage* of what the engine already makes,
// and the percentage depends on whether the engine is forced-induction
// (tunes unlock boost/timing → big %) or naturally aspirated (small %).
//
// We only rescale catalog POWER mods that the user left at their default. If
// someone hand-entered a dyno number, we respect it. Non-power mods (tires,
// suspension, weight, aero, brakes, trans) are untouched — their catalog
// numbers are already roughly platform-independent.

export type AspirationLike =
  | 'NA' | 'Turbo' | 'TwinTurbo' | 'Supercharged' | 'EV' | 'Hybrid' | 'Other' | null | undefined;

const FORCED_INDUCTION = new Set(['Turbo', 'TwinTurbo', 'Supercharged']);

// pct of stock crank HP the mod adds, split by forced-induction (fi) vs NA.
// Keyed by the seed catalog id (drizzle/0005_seed.sql).
const POWER_MOD_PCT: Record<string, { fi: number; na: number }> = {
  mod_tune_stage1:  { fi: 0.11, na: 0.05 },
  mod_tune_stage2:  { fi: 0.18, na: 0.08 },
  mod_tune_stage3:  { fi: 0.28, na: 0.11 },
  mod_tune_e85:     { fi: 0.13, na: 0.06 },
  mod_meth_inject:  { fi: 0.06, na: 0.04 },
  // Adding/upgrading forced induction — a bigger single jump. On an already
  // boosted car it's an upgrade (smaller %); on an NA car it's a conversion
  // (larger % of the NA baseline).
  mod_turbo_swap:   { fi: 0.45, na: 0.60 },
  mod_supercharger: { fi: 0.40, na: 0.50 },
};

export function isScalablePowerMod(catalogId: string | null | undefined): boolean {
  return !!catalogId && POWER_MOD_PCT[catalogId] != null;
}

function isForcedInduction(a: AspirationLike): boolean {
  return FORCED_INDUCTION.has((a ?? '') as string);
}

/**
 * Platform-relative HP gain for a catalog power mod. Falls back to the flat
 * catalog gain when the platform can't be scaled (unknown stock HP, or a mod
 * that isn't in the percentage table).
 */
export function platformRelativeHpGain(
  catalogId: string | null | undefined,
  stockHp: number | null | undefined,
  aspiration: AspirationLike,
  flatGain: number,
): number {
  const spec = catalogId ? POWER_MOD_PCT[catalogId] : undefined;
  if (!spec || !stockHp || stockHp <= 0) return flatGain;
  const pct = isForcedInduction(aspiration) ? spec.fi : spec.na;
  return Math.round(stockHp * pct);
}

/**
 * Torque that accompanies a scaled HP gain. Forced-induction makes more torque
 * than HP; NA makes a bit less.
 */
export function platformRelativeTorqueGain(
  hpGain: number,
  aspiration: AspirationLike,
): number {
  return Math.round(hpGain * (isForcedInduction(aspiration) ? 1.05 : 0.9));
}
