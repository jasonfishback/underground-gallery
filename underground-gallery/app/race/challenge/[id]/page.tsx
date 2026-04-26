// app/race/challenge/[id]/page.tsx

import { redirect, notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { raceChallenges, users, vehicles, vehicleSpecs } from '@/lib/db/schema';
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
      curbWeight: vehicleSpecs.curbWeight,
      drivetrain: vehicleSpecs.drivetrain,
    })
    .from(vehicles)
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .where(eq(vehicles.id, c.opponentVehicleId))
    .limit(1);

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
            vehicleStockHp: chalVehicle?.stockHp ?? null,
            vehicleWeight: chalVehicle?.curbWeight ?? null,
            vehicleDrivetrain: chalVehicle?.drivetrain ?? null,
          }}
          opponent={{
            callsign: oppUser?.callsign ?? null,
            isModerator: oppUser?.isModerator ?? false,
            vehicleLabel: oppVehicle ? `${oppVehicle.year} ${oppVehicle.make} ${oppVehicle.model}${oppVehicle.trim ? ' ' + oppVehicle.trim : ''}` : 'Unknown',
            vehicleStockHp: oppVehicle?.stockHp ?? null,
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
