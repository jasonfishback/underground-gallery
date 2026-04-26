// app/race/result/[id]/page.tsx

import { redirect, notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { raceResults, vehicles, users, vehicleSpecs } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { ResultPageClient } from '@/components/race/ResultPageClient';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function RaceResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ animate?: string; startAt?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');

  const [r] = await db
    .select()
    .from(raceResults)
    .where(eq(raceResults.id, id))
    .limit(1);
  if (!r) notFound();
  if (r.hiddenAt) notFound();

  // Both vehicles + owners
  const [chalV] = r.challengerVehicleId
    ? await db
        .select({
          year: vehicles.year, make: vehicles.make, model: vehicles.model, trim: vehicles.trim,
          drivetrainOverride: vehicles.drivetrainOverride,
          drivetrain: vehicleSpecs.drivetrain,
        })
        .from(vehicles)
        .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
        .where(eq(vehicles.id, r.challengerVehicleId))
        .limit(1)
    : [null];
  const [oppV] = r.opponentVehicleId
    ? await db
        .select({
          year: vehicles.year, make: vehicles.make, model: vehicles.model, trim: vehicles.trim,
          drivetrainOverride: vehicles.drivetrainOverride,
          drivetrain: vehicleSpecs.drivetrain,
        })
        .from(vehicles)
        .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
        .where(eq(vehicles.id, r.opponentVehicleId))
        .limit(1)
    : [null];

  const [chalU] = await db
    .select({ callsign: users.callsign, isModerator: users.isModerator })
    .from(users)
    .where(eq(users.id, r.challengerUserId))
    .limit(1);
  const [oppU] = r.opponentUserId
    ? await db
        .select({ callsign: users.callsign, isModerator: users.isModerator })
        .from(users)
        .where(eq(users.id, r.opponentUserId))
        .limit(1)
    : [null];

  const challengerLabel = chalV
    ? `${chalV.year} ${chalV.make} ${chalV.model}${chalV.trim ? ' ' + chalV.trim : ''}`
    : 'Unknown';
  const opponentLabel = oppV
    ? `${oppV.year} ${oppV.make} ${oppV.model}${oppV.trim ? ' ' + oppV.trim : ''}`
    : 'Unknown';

  const winner =
    r.winnerVehicleId === r.challengerVehicleId
      ? 'challenger'
      : r.winnerVehicleId === r.opponentVehicleId
        ? 'opponent'
        : 'tie';

  const isParticipant =
    r.challengerUserId === ctx.userId || r.opponentUserId === ctx.userId;

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <ResultPageClient
          autoAnimate={sp.animate === '1'}
          startAt={sp.startAt ? Number(sp.startAt) : undefined}
          challengeId={r.challengeId ?? null}
          shareSlug={r.shareSlug ?? null}
          isPublic={r.isPublic ?? false}
          isParticipant={isParticipant}
          raceResultId={r.id}
          challengerLabel={challengerLabel}
          challengerShortLabel={chalV ? `${chalV.make} ${chalV.model}` : 'Challenger'}
          challengerCallsign={chalU?.callsign ?? null}
          challengerIsAdmin={chalU?.isModerator ?? false}
          challengerDrivetrain={chalV?.drivetrainOverride ?? chalV?.drivetrain ?? 'UNKNOWN'}
          opponentLabel={opponentLabel}
          opponentShortLabel={oppV ? `${oppV.make} ${oppV.model}` : 'Opponent'}
          opponentCallsign={oppU?.callsign ?? null}
          opponentIsAdmin={oppU?.isModerator ?? false}
          opponentDrivetrain={oppV?.drivetrainOverride ?? oppV?.drivetrain ?? 'UNKNOWN'}
          winner={winner as 'challenger' | 'opponent' | 'tie'}
          raceType={r.raceType}
          estimatedGap={r.estimatedGap ?? 0}
          challengerEt={r.challengerEstimatedEt}
          opponentEt={r.opponentEstimatedEt}
          challengerTrap={r.challengerTrapSpeed}
          opponentTrap={r.opponentTrapSpeed}
          summary={r.summary ?? ''}
          source={r.source as 'challenge' | 'practice'}
          createdAt={r.createdAt}
        />
      </div>
    </div>
  );
}
