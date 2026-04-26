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
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <header style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, marginBottom: 8 }}>
            VIRTUAL RACE
          </div>
          <h1 style={{ fontSize: 32, margin: 0, letterSpacing: '0.05em' }}>Pick your fight.</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, maxWidth: 600 }}>
            Race any car instantly in practice mode, or send a formal challenge to another driver.
            Challenges run side-by-side with a live light tree and ¼-mile simulation.
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
