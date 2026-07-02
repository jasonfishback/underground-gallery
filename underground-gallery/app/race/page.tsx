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
    <div
      className="race-hero-bg"
      style={{ minHeight: '100dvh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 24px 96px' }}>
        <header className="race-rise" style={{ marginBottom: 56, maxWidth: 760 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 10,
              letterSpacing: '0.32em',
              color: 'rgba(255, 138, 138, 0.85)',
              fontFamily: fonts.mono,
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 18,
              padding: '6px 12px',
              border: '1px solid rgba(255, 80, 80, 0.28)',
              borderRadius: 999,
              background: 'rgba(255, 42, 42, 0.06)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: colors.accent, boxShadow: '0 0 8px rgba(255, 42, 42, 0.8)' }} />
            Underground · Race
          </div>
          <h1
            style={{
              fontSize: 'clamp(42px, 5.5vw, 68px)',
              fontWeight: 800,
              margin: '0 0 18px',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
            }}
          >
            Pick your fight.
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'rgba(245,246,247,0.62)',
              margin: 0,
              lineHeight: 1.55,
              maxWidth: 620,
            }}
          >
            Race instantly in practice, or send a formal challenge. Side-by-side
            ¼-mile simulation modeled on real HP, weight, drivetrain, tires, and
            your installed mods.
          </p>
        </header>

        {inbox.length > 0 && <ChallengeInbox challenges={inbox} />}

        {myCars.length === 0 ? (
          <div
            className="ug-card race-rise"
            style={{
              padding: '56px 24px',
              textAlign: 'center',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            <div style={{ fontSize: 34, marginBottom: 12 }}>🏁</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
              You need a car to race.
            </h2>
            <p
              style={{
                fontSize: 13,
                color: colors.textMuted,
                margin: '0 0 24px',
                lineHeight: 1.6,
              }}
            >
              Add your ride to the garage — specs auto-fill from the catalog —
              then come back and pick your fight.
            </p>
            <a href="/me" className="ug-btn ug-btn-primary">
              + Add your car
            </a>
          </div>
        ) : (
          <RaceUI
            myCars={myCars}
            communityCars={communityCarsRaw}
            myUserId={ctx.userId}
            myCallsign={ctx.callsign}
          />
        )}

        <div style={{ marginTop: 64, textAlign: 'center' }}>
          <a
            href="/race/history"
            className="ug-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.3em',
              color: colors.textMuted,
              textDecoration: 'none',
              borderBottom: `1px solid ${colors.border}`,
              paddingBottom: 4,
            }}
          >
            VIEW RACE HISTORY →
          </a>
        </div>
      </div>
    </div>
  );
}
