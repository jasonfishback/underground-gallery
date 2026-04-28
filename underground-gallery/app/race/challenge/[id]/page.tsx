// app/race/challenge/[id]/page.tsx

import { redirect, notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { raceChallenges, users, vehicles, vehicleSpecs, userCarMods, modCatalog } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { ChallengeView } from '@/components/race/ChallengeView';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function ChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');

  const [c] = await db
    .select({
      id: raceChallenges.id,
      challengerUserId: raceChallenges.challengerUserId,
      challengerVehicleId: raceChallenges.challengerVehicleId,
      opponentUserId: raceChallenges.opponentUserId,
      opponentVehicleId: raceChallenges.opponentVehicleId,
      raceType: raceChallenges.raceType,
      message: raceChallenges.message,
      status: raceChallenges.status,
      raceResultId: raceChallenges.raceResultId,
      expiresAt: raceChallenges.expiresAt,
      createdAt: raceChallenges.createdAt,
    })
    .from(raceChallenges)
    .where(eq(raceChallenges.id, id))
    .limit(1);

  if (!c) notFound();

  // Permission: only the two participants can view
  if (c.challengerUserId !== ctx.userId && c.opponentUserId !== ctx.userId) {
    redirect('/race');
  }

  // If already raced, redirect to result
  if (c.status === 'raced' && c.raceResultId) {
    redirect(`/race/result/${c.raceResultId}`);
  }

  // Load both users + cars
  const [chalUser] = await db
    .select({ id: users.id, callsign: users.callsign, isModerator: users.isModerator })
    .from(users)
    .where(eq(users.id, c.challengerUserId))
    .limit(1);
  const [oppUser] = await db
    .select({ id: users.id, callsign: users.callsign, isModerator: users.isModerator })
    .from(users)
    .where(eq(users.id, c.opponentUserId))
    .limit(1);

  const [chalVehicle] = await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      stockHp: vehicleSpecs.stockHp,
      stockTorque: vehicleSpecs.stockTorque,
      curbWeight: vehicleSpecs.curbWeight,
      drivetrain: vehicleSpecs.drivetrain,
    })
    .from(vehicles)
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .where(eq(vehicles.id, c.challengerVehicleId))
    .limit(1);

  const [oppVehicle] = await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      stockHp: vehicleSpecs.stockHp,
      stockTorque: vehicleSpecs.stockTorque,
      curbWeight: vehicleSpecs.curbWeight,
      drivetrain: vehicleSpecs.drivetrain,
    })
    .from(vehicles)
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .where(eq(vehicles.id, c.opponentVehicleId))
    .limit(1);

  async function loadModGains(vehicleId: string) {
    const rows = await db
      .select({
        hpGain: userCarMods.hpGain,
        torqueGain: userCarMods.torqueGain,
        catalogHp: modCatalog.defaultHpGain,
      })
      .from(userCarMods)
      .leftJoin(modCatalog, eq(modCatalog.id, userCarMods.modCatalogId))
      .where(eq(userCarMods.vehicleId, vehicleId));
    let hp = 0, tq = 0;
    for (const r of rows) {
      const h = r.hpGain ?? r.catalogHp ?? 0;
      const t = (r.torqueGain != null && r.torqueGain !== 0) ? r.torqueGain : Math.round(h * 0.9);
      hp += h;
      tq += t;
    }
    return { hp, tq };
  }
  const [chalGains, oppGains] = await Promise.all([
    loadModGains(c.challengerVehicleId),
    loadModGains(c.opponentVehicleId),
  ]);
  const chalHp = chalVehicle?.stockHp != null ? chalVehicle.stockHp + chalGains.hp : null;
  const chalTorque = chalVehicle?.stockTorque != null
    ? chalVehicle.stockTorque + chalGains.tq
    : (chalVehicle?.stockHp != null ? Math.round(chalVehicle.stockHp * 0.9) + chalGains.tq : null);
  const oppHp = oppVehicle?.stockHp != null ? oppVehicle.stockHp + oppGains.hp : null;
  const oppTorque = oppVehicle?.stockTorque != null
    ? oppVehicle.stockTorque + oppGains.tq
    : (oppVehicle?.stockHp != null ? Math.round(oppVehicle.stockHp * 0.9) + oppGains.tq : null);

  const isMyChallenge = c.challengerUserId === ctx.userId;
  const isOpponent = c.opponentUserId === ctx.userId;

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <ChallengeView
          challengeId={c.id}
          status={c.status}
          raceType={c.raceType}
          message={c.message}
          expiresAt={c.expiresAt}
          createdAt={c.createdAt}
          challenger={{
            callsign: chalUser?.callsign ?? null,
            isModerator: chalUser?.isModerator ?? false,
            vehicleLabel: chalVehicle ? `${chalVehicle.year} ${chalVehicle.make} ${chalVehicle.model}${chalVehicle.trim ? ' ' + chalVehicle.trim : ''}` : 'Unknown',
            vehicleHp: chalHp,
            vehicleTorque: chalTorque,
            vehicleWeight: chalVehicle?.curbWeight ?? null,
            vehicleDrivetrain: chalVehicle?.drivetrain ?? null,
          }}
          opponent={{
            callsign: oppUser?.callsign ?? null,
            isModerator: oppUser?.isModerator ?? false,
            vehicleLabel: oppVehicle ? `${oppVehicle.year} ${oppVehicle.make} ${oppVehicle.model}${oppVehicle.trim ? ' ' + oppVehicle.trim : ''}` : 'Unknown',
            vehicleHp: oppHp,
            vehicleTorque: oppTorque,
            vehicleWeight: oppVehicle?.curbWeight ?? null,
            vehicleDrivetrain: oppVehicle?.drivetrain ?? null,
          }}
          isMyChallenge={isMyChallenge}
          isOpponent={isOpponent}
          justSent={sp.sent === '1'}
        />
      </div>
    </div>
  );
}
