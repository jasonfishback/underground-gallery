// app/race/page.tsx

import { redirect } from 'next/navigation';
import { eq, ne, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { vehicles, users, photos, raceChallenges } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { RaceUI } from '@/components/race/RaceUI';
import { ChallengeInbox } from '@/components/race/ChallengeInbox';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function RacePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');
  if (!ctx.setupCompleted) redirect('/setup');

  const myCars = await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      isPrimary: vehicles.isPrimary,
      thumbUrl: photos.urlThumb,
    })
    .from(vehicles)
    .leftJoin(photos, eq(photos.id, vehicles.primaryPhotoId))
    .where(eq(vehicles.userId, ctx.userId));

  const communityCarsRaw = await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      ownerUserId: vehicles.userId,
      ownerCallsign: users.callsign,
      thumbUrl: photos.urlThumb,
    })
    .from(vehicles)
    .innerJoin(users, eq(users.id, vehicles.userId))
    .leftJoin(photos, eq(photos.id, vehicles.primaryPhotoId))
    .where(and(eq(users.status, 'active'), ne(vehicles.userId, ctx.userId)))
    .limit(200);

  const inbox = await db
    .select({
      id: raceChallenges.id,
      raceType: raceChallenges.raceType,
      message: raceChallenges.message,
      status: raceChallenges.status,
      createdAt: raceChallenges.createdAt,
      expiresAt: raceChallenges.expiresAt,
      challengerCallsign: users.callsign,
      challengerVehicleYear: vehicles.year,
      challengerVehicleMake: vehicles.make,
      challengerVehicleModel: vehicles.model,
    })
    .from(raceChallenges)
    .innerJoin(users, eq(users.id, raceChallenges.challengerUserId))
    .innerJoin(vehicles, eq(vehicles.id, raceChallenges.challengerVehicleId))
    .where(and(eq(raceChallenges.opponentUserId, ctx.userId), eq(raceChallenges.status, 'pending')))
    .orderBy(desc(raceChallenges.createdAt))
    .limit(20);

  return (
    <div style={{ minHeight: '100dvh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
        <header style={{ marginBottom: 36, maxWidth: 720 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.4em',
              color: colors.accent,
              fontFamily: fonts.mono,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            UNDERGROUND · RACE
          </div>
          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              margin: '0 0 14px',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
            }}
          >
            Pick your fight.
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'rgba(245,246,247,0.65)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Race any car instantly in practice mode, or send a formal challenge.
            Side-by-side ¼-mile simulation with a live light tree — outcomes use real
            HP, weight, drivetrain, tires, and your installed mods.
          </p>
        </header>

        {inbox.length > 0 && <ChallengeInbox challenges={inbox} />}

        <RaceUI myCars={myCars} communityCars={communityCarsRaw} />

        <div style={{ marginTop: 64, textAlign: 'center' }}>
          <a
            href="/race/history"
            style={{
              fontSize: 11,
              letterSpacing: '0.3em',
              color: colors.textMuted,
              textDecoration: 'none',
              borderBottom: `0.5px solid ${colors.border}`,
              paddingBottom: 4,
              fontFamily: fonts.mono,
            }}
          >
            VIEW RACE HISTORY →
          </a>
        </div>
      </div>
    </div>
  );
}
