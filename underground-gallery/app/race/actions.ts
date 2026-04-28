// app/race/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  users,
  vehicles,
  vehicleSpecs,
  userCarMods,
  modCatalog,
  raceResults,
  raceChallenges,
  notifications,
} from '@/lib/db/schema';
import { requireSetupComplete, isAuthError } from '@/lib/auth/gates';
import { calculateBuild } from '@/lib/race/build';
import { runRace } from '@/lib/race/calculator';
import {
  notifyChallengeReceived,
  notifyChallengeAccepted,
  notifyChallengeDeclined,
  notifyRaceCompleted,
} from '@/lib/notifications/service';
import { publishRaceEvent } from '@/lib/pusher/server';
import { raceTypeSchema } from '@/lib/validation/race';

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const newId = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz', 12);

const CHALLENGE_TTL_DAYS = 7;

// ── Create challenge ─────────────────────────────────────────────────────

const createChallengeSchema = z.object({
  challengerVehicleId: z.string().min(1),
  opponentUserId: z.string().min(1),
  opponentVehicleId: z.string().min(1),
  raceType: raceTypeSchema,
  message: z.string().max(500).optional(),
});

export async function createChallenge(raw: unknown): Promise<Result<{ challengeId: string }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = createChallengeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  // Validate ownership: challenger vehicle must belong to me
  const [chal] = await db
    .select({ userId: vehicles.userId, year: vehicles.year, make: vehicles.make, model: vehicles.model, trim: vehicles.trim })
    .from(vehicles)
    .where(eq(vehicles.id, parsed.data.challengerVehicleId))
    .limit(1);
  if (!chal || chal.userId !== ctx.userId) return { ok: false, error: 'Your vehicle not found' };

  // Validate opponent vehicle belongs to opponent
  const [opp] = await db
    .select({ userId: vehicles.userId, year: vehicles.year, make: vehicles.make, model: vehicles.model, trim: vehicles.trim })
    .from(vehicles)
    .where(eq(vehicles.id, parsed.data.opponentVehicleId))
    .limit(1);
  if (!opp) return { ok: false, error: 'Opponent vehicle not found' };
  if (opp.userId !== parsed.data.opponentUserId) {
    return { ok: false, error: "That's not their vehicle" };
  }
  if (opp.userId === ctx.userId) {
    return { ok: false, error: "You can't challenge yourself" };
  }

  // Opponent must be active
  const [oppUser] = await db
    .select({ status: users.status, callsign: users.callsign })
    .from(users)
    .where(eq(users.id, parsed.data.opponentUserId))
    .limit(1);
  if (!oppUser || oppUser.status !== 'active') {
    return { ok: false, error: 'Opponent not available' };
  }

  // My callsign for the email
  const [me] = await db
    .select({ callsign: users.callsign })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);

  const challengeId = newId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(raceChallenges).values({
    id: challengeId,
    challengerUserId: ctx.userId,
    challengerVehicleId: parsed.data.challengerVehicleId,
    opponentUserId: parsed.data.opponentUserId,
    opponentVehicleId: parsed.data.opponentVehicleId,
    raceType: parsed.data.raceType,
    message: parsed.data.message ?? null,
    status: 'pending',
    expiresAt,
  });

  // Notify the opponent
  const challengerCallsign = me?.callsign ?? 'A driver';
  const challengerVehicleLabel = `${chal.year} ${chal.make} ${chal.model}${chal.trim ? ' ' + chal.trim : ''}`;
  const opponentVehicleLabel = `${opp.year} ${opp.make} ${opp.model}${opp.trim ? ' ' + opp.trim : ''}`;
  await notifyChallengeReceived({
    opponentUserId: parsed.data.opponentUserId,
    challengerCallsign,
    challengerVehicleLabel,
    opponentVehicleLabel,
    raceType: parsed.data.raceType,
    challengeId,
  });

  revalidatePath('/race');
  return { ok: true, data: { challengeId } };
}

// ── Accept / decline ─────────────────────────────────────────────────────

export async function acceptChallenge(challengeId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [c] = await db.select().from(raceChallenges).where(eq(raceChallenges.id, challengeId)).limit(1);
  if (!c) return { ok: false, error: 'Challenge not found' };
  if (c.opponentUserId !== ctx.userId) return { ok: false, error: 'Not your challenge to accept' };
  if (c.status !== 'pending') return { ok: false, error: `Challenge is already ${c.status}` };
  if (c.expiresAt < new Date()) {
    await db.update(raceChallenges).set({ status: 'expired' }).where(eq(raceChallenges.id, challengeId));
    return { ok: false, error: 'Challenge has expired' };
  }

  await db
    .update(raceChallenges)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(raceChallenges.id, challengeId));

  const [me] = await db
    .select({ callsign: users.callsign })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);
  await notifyChallengeAccepted({
    challengerUserId: c.challengerUserId,
    opponentCallsign: me?.callsign ?? 'Your opponent',
    challengeId,
  });

  // Real-time: notify the challenger's open page that we accepted
  await publishRaceEvent(challengeId, 'challenge-accepted', {
    acceptedAt: Date.now(),
    opponentCallsign: me?.callsign ?? null,
  });

  revalidatePath('/race');
  revalidatePath(`/race/challenge/${challengeId}`);
  return { ok: true };
}

export async function declineChallenge(challengeId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [c] = await db.select().from(raceChallenges).where(eq(raceChallenges.id, challengeId)).limit(1);
  if (!c) return { ok: false, error: 'Challenge not found' };
  if (c.opponentUserId !== ctx.userId) return { ok: false, error: 'Not your challenge' };
  if (c.status !== 'pending') return { ok: false, error: `Challenge is already ${c.status}` };

  await db
    .update(raceChallenges)
    .set({ status: 'declined', declinedAt: new Date() })
    .where(eq(raceChallenges.id, challengeId));

  const [me] = await db.select({ callsign: users.callsign }).from(users).where(eq(users.id, ctx.userId)).limit(1);
  await notifyChallengeDeclined({
    challengerUserId: c.challengerUserId,
    opponentCallsign: me?.callsign ?? 'Your opponent',
  });

  revalidatePath('/race');
  return { ok: true };
}

// ── Run a challenge ──────────────────────────────────────────────────────

/**
 * Either party (challenger or opponent) can call this once the challenge is
 * accepted. Computes the result, persists it, links it to the challenge,
 * notifies both parties, publishes a Pusher 'race-go' event for synced
 * playback, and returns the result_id + startAt timestamp so the caller
 * can navigate to /race/result/[id]?animate=1&startAt=…
 */
export async function runChallenge(
  challengeId: string,
): Promise<Result<{ raceResultId: string; startAt: number }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [c] = await db.select().from(raceChallenges).where(eq(raceChallenges.id, challengeId)).limit(1);
  if (!c) return { ok: false, error: 'Challenge not found' };
  if (c.challengerUserId !== ctx.userId && c.opponentUserId !== ctx.userId) {
    return { ok: false, error: 'Not your challenge' };
  }

  // Idempotent: if already raced, return the existing result. Use a startAt
  // in the past so the animation plays immediately for late viewers.
  if (c.status === 'raced' && c.raceResultId) {
    return { ok: true, data: { raceResultId: c.raceResultId, startAt: Date.now() } };
  }
  if (c.status !== 'accepted') {
    return { ok: false, error: 'Challenge not accepted yet' };
  }

  // Load both cars
  const [chalCar, oppCar] = await Promise.all([
    loadVehicleForRace(c.challengerVehicleId),
    loadVehicleForRace(c.opponentVehicleId),
  ]);
  if (!chalCar) return { ok: false, error: 'Challenger vehicle missing' };
  if (!oppCar) return { ok: false, error: 'Opponent vehicle missing' };

  const chalBuild = calculateBuild(chalCar.label, chalCar.stock, chalCar.mods, chalCar.overrides);
  const oppBuild = calculateBuild(oppCar.label, oppCar.stock, oppCar.mods, oppCar.overrides);
  const result = runRace(chalBuild.raceCar, oppBuild.raceCar, c.raceType);

  const winnerVehicleId =
    result.winner === 'challenger'
      ? c.challengerVehicleId
      : result.winner === 'opponent'
        ? c.opponentVehicleId
        : null;

  const raceResultId = newId();
  // Short, shareable slug for the spectate URL — easier to text or read aloud
  // than the full id. 6 chars from base58-ish alphabet → ~30M unique values.
  const shareSlug = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 6)();
  await db.transaction(async (tx) => {
    await tx.insert(raceResults).values({
      id: raceResultId,
      challengerUserId: c.challengerUserId,
      challengerVehicleId: c.challengerVehicleId,
      opponentUserId: c.opponentUserId,
      opponentVehicleId: c.opponentVehicleId,
      raceType: c.raceType,
      challengerScore: result.challengerScore,
      opponentScore: result.opponentScore,
      challengerEstimatedEt: result.challengerEt,
      opponentEstimatedEt: result.opponentEt,
      challengerTrapSpeed: result.challengerTrap,
      opponentTrapSpeed: result.opponentTrap,
      winnerVehicleId,
      estimatedGap: result.estimatedGap,
      summary: result.summary,
      calculationJson: { challenger: chalBuild, opponent: oppBuild, result },
      source: 'challenge',
      challengeId: c.id,
      // Challenge results are public by default — they each get a spectate page
      isPublic: true,
      shareSlug,
    });

    await tx
      .update(raceChallenges)
      .set({
        status: 'raced',
        raceResultId,
        racedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(raceChallenges.id, challengeId));
  });

  // Load callsigns for notification text
  const [chalU, oppU] = await Promise.all([
    db.select({ callsign: users.callsign }).from(users).where(eq(users.id, c.challengerUserId)).limit(1),
    db.select({ callsign: users.callsign }).from(users).where(eq(users.id, c.opponentUserId)).limit(1),
  ]);
  const chalCallsign = chalU[0]?.callsign ?? 'Challenger';
  const oppCallsign = oppU[0]?.callsign ?? 'Opponent';

  await Promise.all([
    notifyRaceCompleted({
      userId: c.challengerUserId,
      won: result.winner === 'challenger',
      myCallsign: chalCallsign,
      opponentCallsign: oppCallsign,
      raceType: c.raceType,
      raceResultId,
      gapSeconds: result.estimatedGap,
    }),
    notifyRaceCompleted({
      userId: c.opponentUserId,
      won: result.winner === 'opponent',
      myCallsign: oppCallsign,
      opponentCallsign: chalCallsign,
      raceType: c.raceType,
      raceResultId,
      gapSeconds: result.estimatedGap,
    }),
  ]);

  // Real-time sync: tell both clients to navigate to the result page and
  // schedule the animation start at the same future moment. 3-second buffer
  // gives slow connections time to load the result page before the lights
  // start dropping.
  const startAt = Date.now() + 3000;
  await publishRaceEvent(challengeId, 'race-go', {
    raceResultId,
    startAt,
    triggeredByUserId: ctx.userId,
  });

  revalidatePath('/race');
  revalidatePath('/race/history');
  revalidatePath(`/race/result/${raceResultId}`);
  return { ok: true, data: { raceResultId, startAt } };
}

// ── Practice race (no challenge required) ────────────────────────────────

const practiceSchema = z.object({
  challengerVehicleId: z.string().min(1),
  opponentVehicleId: z.string().min(1),
  raceType: raceTypeSchema,
  saveResult: z.boolean().default(false),
});

export async function runPracticeRace(raw: unknown): Promise<Result<{ raceResultId: string | null; result: unknown }>> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const parsed = practiceSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  // Challenger vehicle must be mine
  const [me] = await db
    .select({ userId: vehicles.userId })
    .from(vehicles)
    .where(eq(vehicles.id, parsed.data.challengerVehicleId))
    .limit(1);
  if (!me || me.userId !== ctx.userId) return { ok: false, error: 'Your vehicle not found' };

  const [chalCar, oppCar] = await Promise.all([
    loadVehicleForRace(parsed.data.challengerVehicleId),
    loadVehicleForRace(parsed.data.opponentVehicleId),
  ]);
  if (!chalCar) return { ok: false, error: 'Your vehicle not found' };
  if (!oppCar) return { ok: false, error: 'Opponent vehicle not found' };

  const chalBuild = calculateBuild(chalCar.label, chalCar.stock, chalCar.mods, chalCar.overrides);
  const oppBuild = calculateBuild(oppCar.label, oppCar.stock, oppCar.mods, oppCar.overrides);
  const result = runRace(chalBuild.raceCar, oppBuild.raceCar, parsed.data.raceType);

  let raceResultId: string | null = null;
  if (parsed.data.saveResult) {
    raceResultId = newId();
    const winnerVehicleId =
      result.winner === 'challenger'
        ? parsed.data.challengerVehicleId
        : result.winner === 'opponent'
          ? parsed.data.opponentVehicleId
          : null;

    await db.insert(raceResults).values({
      id: raceResultId,
      challengerUserId: ctx.userId,
      challengerVehicleId: parsed.data.challengerVehicleId,
      opponentUserId: oppCar.userId,
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
      calculationJson: { challenger: chalBuild, opponent: oppBuild, result },
      source: 'practice',
    });

    revalidatePath('/race/history');
  }

  return {
    ok: true,
    data: {
      raceResultId,
      result: { result, chalBuild, oppBuild },
    },
  };
}

// ── Notifications: mark read ─────────────────────────────────────────────

export async function markNotificationRead(notificationId: string): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, ctx.userId)));
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.userId, ctx.userId));
  return { ok: true };
}

// ── Public visibility toggle ─────────────────────────────────────────────

/**
 * Either participant in a challenge race can hide it from the public
 * spectate page. Sets is_public=false but doesn't delete — it stays
 * visible to participants and in their private race log.
 */
export async function toggleRacePublic(
  raceResultId: string,
  isPublic: boolean,
): Promise<Result> {
  const ctx = await requireSetupComplete();
  if (isAuthError(ctx)) return { ok: false, error: 'Not authorized' };

  const [row] = await db
    .select({
      challengerUserId: raceResults.challengerUserId,
      opponentUserId: raceResults.opponentUserId,
      source: raceResults.source,
    })
    .from(raceResults)
    .where(eq(raceResults.id, raceResultId))
    .limit(1);
  if (!row) return { ok: false, error: 'Race not found' };
  if (row.challengerUserId !== ctx.userId && row.opponentUserId !== ctx.userId) {
    return { ok: false, error: 'Not your race' };
  }
  if (row.source !== 'challenge') {
    return { ok: false, error: 'Only challenge results can be made public' };
  }

  await db.update(raceResults).set({ isPublic }).where(eq(raceResults.id, raceResultId));
  revalidatePath(`/race/result/${raceResultId}`);
  return { ok: true };
}

// ── Loader (shared) ──────────────────────────────────────────────────────

async function loadVehicleForRace(vehicleId: string) {
  const [v] = await db
    .select({
      vehicle: vehicles,
      spec: vehicleSpecs,
    })
    .from(vehicles)
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .where(eq(vehicles.id, vehicleId))
    .limit(1);
  if (!v) return null;

  const modsRaw = await db
    .select({
      id: userCarMods.id,
      hpGain: userCarMods.hpGain,
      torqueGain: userCarMods.torqueGain,
      weightChange: userCarMods.weightChange,
      tractionModifier: userCarMods.tractionModifier,
      launchModifier: userCarMods.launchModifier,
      catalogDefaultHp: modCatalog.defaultHpGain,
    })
    .from(userCarMods)
    .leftJoin(modCatalog, eq(modCatalog.id, userCarMods.modCatalogId))
    .where(eq(userCarMods.vehicleId, vehicleId));
  const mods = modsRaw.map(m => {
    const effectiveHp = m.hpGain ?? m.catalogDefaultHp ?? 0;
    const explicitTq = m.torqueGain;
    const effectiveTq = (explicitTq != null && explicitTq !== 0) ? explicitTq : Math.round(effectiveHp * 0.9);
    return { id: m.id, hpGain: effectiveHp, torqueGain: effectiveTq, weightChange: m.weightChange ?? 0, tractionModifier: m.tractionModifier ?? 0, launchModifier: m.launchModifier ?? 0, shiftModifier: 0, handlingModifier: 0 };
  });

  // Sum mod gains so trap speed/HP reflect the actual build, not just stock
  const totalHpGain = mods.reduce((s, m) => s + (m.hpGain ?? 0), 0);
  const totalTorqueGain = mods.reduce((s, m) => s + (m.torqueGain ?? 0), 0);
  const totalWeightChange = mods.reduce((s, m) => s + (m.weightChange ?? 0), 0);
  const stockHp = v.spec?.stockHp ?? null;
  const stockTorque = v.spec?.stockTorque ?? null;
  const stockWeight = v.spec?.curbWeight ?? null;
  const builtHp = stockHp != null ? stockHp + totalHpGain : null;
  const builtTorque = stockTorque != null ? stockTorque + totalTorqueGain : null;
  const builtWeight = stockWeight != null ? stockWeight + totalWeightChange : null;

  return {
    label: `  `,
    userId: v.vehicle.userId,
    stock: {
      hp: builtHp,
      torque: builtTorque,
      weight: builtWeight,
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
