// app/u/[callsign]/races/page.tsx
//
// Public race log for a specific user. Lists all their challenge results
// (and any practice runs they chose to save) in reverse chronological order.

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq, or, desc, isNull, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import { raceResults, vehicles, users } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { CallsignWithBadge } from '@/components/AdminBadge';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';

const RACE_LABEL: Record<string, string> = {
  zero_sixty: '0–60',
  quarter_mile: '¼ mile',
  half_mile: '½ mile',
  roll_40_140: '40–140',
  highway_pull: 'highway',
  dig: 'dig',
  overall: 'overall',
};

export default async function UserRacesPage({
  params,
}: {
  params: Promise<{ callsign: string }>;
}) {
  const { callsign } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const [profile] = await db
    .select({ id: users.id, callsign: users.callsign, isModerator: users.isModerator })
    .from(users)
    .where(eq(users.callsign, callsign))
    .limit(1);
  if (!profile) notFound();

  const chalUser = alias(users, 'chal_user');
  const oppUser = alias(users, 'opp_user');
  const chalVehicle = alias(vehicles, 'chal_vehicle');
  const oppVehicle = alias(vehicles, 'opp_vehicle');

  const rows = await db
    .select({
      id: raceResults.id,
      raceType: raceResults.raceType,
      estimatedGap: raceResults.estimatedGap,
      winnerVehicleId: raceResults.winnerVehicleId,
      challengerVehicleId: raceResults.challengerVehicleId,
      opponentVehicleId: raceResults.opponentVehicleId,
      challengerUserId: raceResults.challengerUserId,
      opponentUserId: raceResults.opponentUserId,
      source: raceResults.source,
      createdAt: raceResults.createdAt,
      chalCallsign: chalUser.callsign,
      chalAdmin: chalUser.isModerator,
      oppCallsign: oppUser.callsign,
      oppAdmin: oppUser.isModerator,
    })
    .from(raceResults)
    .leftJoin(chalUser, eq(chalUser.id, raceResults.challengerUserId))
    .leftJoin(oppUser, eq(oppUser.id, raceResults.opponentUserId))
    .leftJoin(chalVehicle, eq(chalVehicle.id, raceResults.challengerVehicleId))
    .leftJoin(oppVehicle, eq(oppVehicle.id, raceResults.opponentVehicleId))
    .where(
      and(
        isNull(raceResults.hiddenAt),
        or(eq(raceResults.challengerUserId, profile.id), eq(raceResults.opponentUserId, profile.id)),
      ),
    )
    .orderBy(desc(raceResults.createdAt))
    .limit(100);

  const wins = rows.filter((r) => {
    const ranAsChal = r.challengerUserId === profile.id;
    return ranAsChal
      ? r.winnerVehicleId === r.challengerVehicleId
      : r.winnerVehicleId === r.opponentVehicleId;
  }).length;
  const ties = rows.filter((r) => !r.winnerVehicleId).length;
  const losses = rows.length - wins - ties;

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 8 }}>
          <Link
            href={`/u/${profile.callsign}`}
            className="ug-mono"
            style={{ fontSize: 11, letterSpacing: '0.3em', color: colors.textMuted, textDecoration: 'none' }}
          >
            ← BACK TO PROFILE
          </Link>
        </div>
        <h1 style={{ fontSize: 28, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
          Race log for{' '}
          <CallsignWithBadge callsign={profile.callsign} isAdmin={profile.isModerator} size="lg" />
        </h1>

        <div className="ug-mono" style={{ display: 'flex', gap: 24, marginBottom: 32, fontSize: 13 }}>
          <span style={{ color: colors.success }}>{wins}W</span>
          <span style={{ color: colors.textMuted }}>{losses}L</span>
          <span style={{ color: colors.textMuted }}>{ties}T</span>
          <span style={{ color: colors.textDim }}>· {rows.length} races</span>
        </div>

        {rows.length === 0 ? (
          <div className="ug-card" style={{ textAlign: 'center', padding: 48, color: colors.textMuted }}>
            No races logged yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map((r) => {
              const ranAsChal = r.challengerUserId === profile.id;
              const won = ranAsChal
                ? r.winnerVehicleId === r.challengerVehicleId
                : r.winnerVehicleId === r.opponentVehicleId;
              const tie = !r.winnerVehicleId;
              const opponentCallsign = ranAsChal ? r.oppCallsign : r.chalCallsign;
              const opponentAdmin = ranAsChal ? r.oppAdmin : r.chalAdmin;

              const verdict = tie ? 'TIE' : won ? 'WON' : 'LOST';
              const verdictColor = tie ? colors.textMuted : won ? colors.success : colors.accent;

              return (
                <Link
                  key={r.id}
                  href={`/race/result/${r.id}`}
                  className="ug-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr auto',
                    gap: 16,
                    padding: '14px 20px',
                    color: colors.text,
                    textDecoration: 'none',
                    fontFamily: fonts.mono,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: verdictColor, letterSpacing: '0.1em' }}>
                    {verdict}
                  </div>
                  <div>
                    <div style={{ fontSize: 13 }}>
                      vs{' '}
                      <CallsignWithBadge
                        callsign={opponentCallsign ?? null}
                        isAdmin={opponentAdmin ?? false}
                        size="sm"
                        color={colors.text}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2, letterSpacing: '0.2em' }}>
                      {RACE_LABEL[r.raceType]?.toUpperCase()} · {r.source === 'challenge' ? 'CHALLENGE' : 'PRACTICE'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {!tie && r.estimatedGap !== null && (
                      <div style={{ fontSize: 13, fontWeight: 700, color: verdictColor }}>
                        {won ? '−' : '+'}
                        {r.estimatedGap.toFixed(2)}s
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: colors.textDim, marginTop: 2 }}>
                      {timeAgo(r.createdAt)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(d: Date): string {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}
