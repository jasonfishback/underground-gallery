// app/garage/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import { db } from '@/lib/db';
import {
  users,
  vehicles,
  vehicleSpecs,
  modCatalog,
  userCarMods,
  raceResults,
} from '@/lib/db/schema';
import {
  manualSpecsSchema,
  addCarFromSpecSchema,
  addCarFromManualSchema,
  addModFromCatalogSchema,
  addCustomModSchema,
  updateModSchema,
  vehicleOverridesSchema,
  raceRequestSchema,
  type ManualSpecsInput,
} from '@/lib/validation/race';
import { requireSetupComplete, isAuthError } from '@/lib/auth/gates';
import { reconcileTier } from '@/lib/auth/tier';
import { calculateBuild } from '@/lib/race/build';
import { runRace } from '@/lib/race/calculator';
import { decodeVin as decodeVinProvider, getSpecs } from '@/lib/vehicle-data';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const newId = customAlphabet(
  '0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz',
  12,
);

// ── Vehicle creation ─────────────────────────────────────────────────────

/**
 * Create a vehicle from an existing spec (cache hit or seed data).
 */
export async function addCarFromSpec(
  raw: unknown,
): Promise<Result<{ vehicleId: string }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = addCarFromSpecSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const [spec] = await db
    .select()
    .from(vehicleSpecs)
    .where(eq(vehicleSpecs.id, parsed.data.vehicleSpecId))
    .limit(1);

  if (!spec) return { ok: false, error: 'Spec not found' };

  const vehicleId = newId();

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.userId, ctx.userId))
      .limit(1);

    await tx.insert(vehicles).values({
      id: vehicleId,
      userId: ctx.userId,
      year: spec.year,
      make: spec.make,
      model: spec.model,
      trim: spec.trim || null,
      vehicleSpecId: spec.id,
      vin: parsed.data.vin || null,
      color: parsed.data.color || null,
      isPrimary: existing.length === 0,
    });

    await reconcileTier(tx, ctx.userId);
  });

  revalidatePath('/me');
  if (ctx.callsign) revalidatePath(`/u/${ctx.callsign}`);
  return { ok: true, data: { vehicleId } };
}

/**
 * Create a vehicle from manual user-entered specs. We also write a new row
 * to vehicle_specs so future users with the same Y/M/M/T get a cache hit.
 */
export async function addCarFromManual(
  raw: unknown,
): Promise<Result<{ vehicleId: string; vehicleSpecId: string }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = addCarFromManualSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const m = parsed.data.manualSpecs;
  const specId = newId();
  const vehicleId = newId();

  await db.transaction(async (tx) => {
    // Upsert spec — if one already exists (from a prior community submission),
    // we link to it instead of creating a duplicate.
    const existing = await tx
      .select({ id: vehicleSpecs.id })
      .from(vehicleSpecs)
      .where(
        and(
          eq(vehicleSpecs.year, m.year),
          eq(vehicleSpecs.make, m.make),
          eq(vehicleSpecs.model, m.model),
          eq(vehicleSpecs.trim, m.trim),
        ),
      )
      .limit(1);

    let usedSpecId: string;
    if (existing.length > 0) {
      usedSpecId = existing[0].id;
    } else {
      await tx.insert(vehicleSpecs).values({
        id: specId,
        year: m.year,
        make: m.make,
        model: m.model,
        trim: m.trim,
        bodyStyle: m.bodyStyle || null,
        engine: m.engine || null,
        displacement: m.displacement || null,
        aspiration: m.aspiration ?? null,
        fuelType: m.fuelType || null,
        transmission: m.transmission ?? null,
        drivetrain: m.drivetrain ?? null,
        stockHp: m.stockHp ?? null,
        stockTorque: m.stockTorque ?? null,
        curbWeight: m.curbWeight ?? null,
        zeroToSixty: m.zeroToSixty ?? null,
        quarterMile: m.quarterMile ?? null,
        topSpeed: m.topSpeed ?? null,
        sourceProvider: 'community',
        sourceConfidence: 'community',
        submittedBy: ctx.userId,
      });
      usedSpecId = specId;
    }

    const existingVehicles = await tx
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.userId, ctx.userId))
      .limit(1);

    await tx.insert(vehicles).values({
      id: vehicleId,
      userId: ctx.userId,
      year: m.year,
      make: m.make,
      model: m.model,
      trim: m.trim || null,
      vehicleSpecId: usedSpecId,
      vin: parsed.data.vin || null,
      color: parsed.data.color || null,
      isPrimary: existingVehicles.length === 0,
    });

    await reconcileTier(tx, ctx.userId);
  });

  revalidatePath('/me');
  if (ctx.callsign) revalidatePath(`/u/${ctx.callsign}`);
  return { ok: true, data: { vehicleId, vehicleSpecId: specId } };
}

/**
 * Decode a VIN. Returns the decoded fields without saving anything — caller
 * decides whether to use them as inputs to addCarFromManual.
 */
export async function decodeVin(vin: string): Promise<Result<unknown>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const result = await decodeVinProvider(vin);
  if (!result) return { ok: false, error: 'Could not decode that VIN' };
  return { ok: true, data: result };
}

// ── Vehicle overrides ────────────────────────────────────────────────────

export async function updateVehicleOverrides(raw: unknown): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = vehicleOverridesSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const [v] = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, parsed.data.vehicleId))
    .limit(1);
  if (!v || v.userId !== ctx.userId) return { ok: false, error: 'Vehicle not found' };

  const update: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.currentHpOverride !== undefined) update.currentHpOverride = d.currentHpOverride;
  if (d.currentTorqueOverride !== undefined) update.currentTorqueOverride = d.currentTorqueOverride;
  if (d.currentWeightOverride !== undefined) update.currentWeightOverride = d.currentWeightOverride;
  if (d.tireType !== undefined) update.tireType = d.tireType;
  if (d.transmissionOverride !== undefined) update.transmissionOverride = d.transmissionOverride;
  if (d.drivetrainOverride !== undefined) update.drivetrainOverride = d.drivetrainOverride;
  if (d.driverSkill !== undefined) update.driverSkill = d.driverSkill;

  await db.update(vehicles).set(update).where(eq(vehicles.id, parsed.data.vehicleId));

  revalidatePath('/me');
  revalidatePath(`/v/${parsed.data.vehicleId}`);
  return { ok: true };
}

// ── Mods ─────────────────────────────────────────────────────────────────

async function assertVehicleOwnership(vehicleId: string, userId: string): Promise<boolean> {
  const [v] = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  return !!v && v.userId === userId;
}

export async function addModFromCatalog(raw: unknown): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = addModFromCatalogSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  if (!(await assertVehicleOwnership(parsed.data.vehicleId, ctx.userId))) {
    return { ok: false, error: 'Vehicle not found' };
  }

  const [preset] = await db
    .select()
    .from(modCatalog)
    .where(eq(modCatalog.id, parsed.data.modCatalogId))
    .limit(1);
  if (!preset) return { ok: false, error: 'Mod preset not found' };

  await db.insert(userCarMods).values({
    id: newId(),
    vehicleId: parsed.data.vehicleId,
    modCatalogId: preset.id,
    category: preset.category,
    hpGain: parsed.data.hpGain ?? preset.defaultHpGain ?? 0,
    torqueGain: parsed.data.torqueGain ?? preset.defaultTorqueGain ?? 0,
    weightChange: parsed.data.weightChange ?? preset.defaultWeightChange ?? 0,
    tractionModifier: preset.tractionModifier ?? 0,
    launchModifier: preset.launchModifier ?? 0,
    shiftModifier: preset.shiftModifier ?? 0,
    handlingModifier: preset.handlingModifier ?? 0,
    reliabilityModifier: preset.reliabilityModifier ?? 0,
    verified: parsed.data.verified ?? false,
    notes: parsed.data.notes ?? null,
  });

  revalidatePath('/me');
  revalidatePath(`/v/${parsed.data.vehicleId}`);
  return { ok: true };
}

export async function addCustomMod(raw: unknown): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = addCustomModSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  if (!(await assertVehicleOwnership(parsed.data.vehicleId, ctx.userId))) {
    return { ok: false, error: 'Vehicle not found' };
  }

  await db.insert(userCarMods).values({
    id: newId(),
    vehicleId: parsed.data.vehicleId,
    modCatalogId: null,
    customName: parsed.data.customName,
    category: parsed.data.category,
    hpGain: parsed.data.hpGain,
    torqueGain: parsed.data.torqueGain,
    weightChange: parsed.data.weightChange,
    tractionModifier: parsed.data.tractionModifier,
    launchModifier: parsed.data.launchModifier,
    shiftModifier: parsed.data.shiftModifier,
    handlingModifier: parsed.data.handlingModifier,
    reliabilityModifier: parsed.data.reliabilityModifier,
    verified: parsed.data.verified,
    notes: parsed.data.notes ?? null,
  });

  revalidatePath('/me');
  revalidatePath(`/v/${parsed.data.vehicleId}`);
  return { ok: true };
}

export async function updateMod(raw: unknown): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = updateModSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Ownership: load mod + vehicle and confirm
  const [mod] = await db
    .select({ vehicleId: userCarMods.vehicleId })
    .from(userCarMods)
    .where(eq(userCarMods.id, parsed.data.modId))
    .limit(1);
  if (!mod) return { ok: false, error: 'Mod not found' };
  if (!(await assertVehicleOwnership(mod.vehicleId, ctx.userId))) {
    return { ok: false, error: 'Mod not found' };
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.hpGain !== undefined) update.hpGain = parsed.data.hpGain;
  if (parsed.data.torqueGain !== undefined) update.torqueGain = parsed.data.torqueGain;
  if (parsed.data.weightChange !== undefined) update.weightChange = parsed.data.weightChange;
  if (parsed.data.verified !== undefined) update.verified = parsed.data.verified;
  if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;

  await db.update(userCarMods).set(update).where(eq(userCarMods.id, parsed.data.modId));

  revalidatePath('/me');
  revalidatePath(`/v/${mod.vehicleId}`);
  return { ok: true };
}

export async function deleteMod(modId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [mod] = await db
    .select({ vehicleId: userCarMods.vehicleId })
    .from(userCarMods)
    .where(eq(userCarMods.id, modId))
    .limit(1);
  if (!mod) return { ok: false, error: 'Mod not found' };
  if (!(await assertVehicleOwnership(mod.vehicleId, ctx.userId))) {
    return { ok: false, error: 'Mod not found' };
  }

  await db.delete(userCarMods).where(eq(userCarMods.id, modId));
  revalidatePath('/me');
  revalidatePath(`/v/${mod.vehicleId}`);
  return { ok: true };
}

// ── Race ─────────────────────────────────────────────────────────────────

/**
 * Run a virtual race between two vehicles. Optionally save the result.
 * Both vehicles must be visible to the user — for now, that means the
 * user owns at least one of them. Public profile pages can pass any
 * vehicle as the opponent since they're already visible.
 */
export async function compareCars(raw: unknown): Promise<Result<unknown>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = raceRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  // Load both vehicles + their specs + their mods
  const [chal, opp] = await Promise.all([
    loadVehicleForRace(parsed.data.challengerVehicleId),
    loadVehicleForRace(parsed.data.opponentVehicleId),
  ]);
  if (!chal) return { ok: false, error: 'Challenger vehicle not found' };
  if (!opp) return { ok: false, error: 'Opponent vehicle not found' };

  const chalBuild = calculateBuild(chal.label, chal.stock, chal.mods, chal.overrides);
  const oppBuild = calculateBuild(opp.label, opp.stock, opp.mods, opp.overrides);

  const result = runRace(chalBuild.raceCar, oppBuild.raceCar, parsed.data.raceType);

  if (parsed.data.saveResult) {
    const winnerVehicleId =
      result.winner === 'challenger'
        ? parsed.data.challengerVehicleId
        : result.winner === 'opponent'
          ? parsed.data.opponentVehicleId
          : null;

    await db.insert(raceResults).values({
      id: newId(),
      challengerUserId: ctx.userId,
      challengerVehicleId: parsed.data.challengerVehicleId,
      opponentUserId: opp.userId,
      opponentVehicleId: parsed.data.opponentVehicleId,
      raceType: parsed.data.raceType,
      challengerScore: result.challengerScore,
      opponentScore: result.opponentScore,
      challengerEstimatedEt: result.challengerEt,
      opponentEstimatedEt: result.opponentEt,
      challengerTrapSpeed: result.challengerTrap,
      opponentTrapSpeed: result.opponentTrap,
      winnerVehicleId,
      estimatedGap: result.estimatedGap,
      summary: result.summary,
      calculationJson: {
        challenger: chalBuild,
        opponent: oppBuild,
        result,
      },
    });
  }

  return {
    ok: true,
    data: {
      result,
      chalBuild,
      oppBuild,
    },
  };
}

async function loadVehicleForRace(vehicleId: string) {
  const [v] = await db
    .select({
      vehicle: vehicles,
      spec: vehicleSpecs,
      ownerCallsign: users.callsign,
    })
    .from(vehicles)
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .leftJoin(users, eq(users.id, vehicles.userId))
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (!v) return null;

  const mods = await db
    .select()
    .from(userCarMods)
    .where(eq(userCarMods.vehicleId, vehicleId));

  return {
    label: `${v.vehicle.year} ${v.vehicle.make} ${v.vehicle.model}${v.vehicle.trim ? ' ' + v.vehicle.trim : ''}`,
    userId: v.vehicle.userId,
    stock: {
      hp: v.spec?.stockHp ?? null,
      torque: v.spec?.stockTorque ?? null,
      weight: v.spec?.curbWeight ?? null,
      drivetrain: v.spec?.drivetrain ?? null,
      transmission: v.spec?.transmission ?? null,
    },
    mods,
    overrides: {
      currentHpOverride: v.vehicle.currentHpOverride,
      currentTorqueOverride: v.vehicle.currentTorqueOverride,
      currentWeightOverride: v.vehicle.currentWeightOverride,
      drivetrainOverride: v.vehicle.drivetrainOverride,
      transmissionOverride: v.vehicle.transmissionOverride,
      tireType: v.vehicle.tireType,
      driverSkill: v.vehicle.driverSkill,
    },
  };
}
