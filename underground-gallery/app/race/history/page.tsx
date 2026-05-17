// app/race/history/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, desc, isNull, and, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import { raceResults, vehicles, users } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
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

export default async function RaceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const chalUser = alias(users, 'chal_user');
  const oppUser = alias(users, 'opp_user');
  const chalVehicle = alias(vehicles, 'chal_vehicle');
  const oppVehicle = alias(vehicles, 'opp_vehicle');

  // Filters
  const filters = [isNull(raceResults.hiddenAt)];
  if (sp.user) {
    // Filter by callsign — challenger or opponent
    filters.push(
      or(
        sql`lower(${chalUser.callsign}) = ${sp.user.toLowerCase()}`,
        sql`lower(${oppUser.callsign}) = ${sp.user.toLowerCase()}`,
      )!,
    );
  }
  if (sp.type && Object.keys(RACE_LABEL).includes(sp.type)) {
    filters.push(eq(raceResults.raceType, sp.type as any));
  }

  const rows = await db
    .select({
      id: raceResults.id,
      raceType: raceResults.raceType,
      estimatedGap: raceResults.estimatedGap,
      challengerEt: raceResults.challengerEstimatedEt,
      opponentEt: raceResults.opponentEstimatedEt,
      winnerVehicleId: raceResults.winnerVehicleId,
      challengerVehicleId: raceResults.challengerVehicleId,
      opponentVehicleId: raceResults.opponentVehicleId,
      source: raceResults.source,
      createdAt: raceResults.createdAt,
      chalCallsign: chalUser.callsign,
      chalAdmin: chalUser.isModerator,
      oppCallsign: oppUser.callsign,
      oppAdmin: oppUser.isModerator,
      chalVehicleLabel: sql<string>`${chalVehicle.year} || ' ' || ${chalVehicle.make} || ' ' || ${chalVehicle.model}`,
      oppVehicleLabel: sql<string>`${oppVehicle.year} || ' ' || ${oppVehicle.make} || ' ' || ${oppVehicle.model}`,
    })
    .from(raceResults)
    .leftJoin(chalUser, eq(chalUser.id, raceResults.challengerUserId))
    .leftJoin(oppUser, eq(oppUser.id, raceResults.opponentUserId))
    .leftJoin(chalVehicle, eq(chalVehicle.id, raceResults.challengerVehicleId))
    .leftJoin(oppVehicle, eq(oppVehicle.id, raceResults.opponentVehicleId))
    .where(and(...filters))
    .orderBy(desc(raceResults.createdAt))
    .limit(100);

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div className="ug-mono" style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, marginBottom: 8 }}>
          ∕∕ RACE HISTORY
        </div>
        <h1 style={{ fontSize: 32, margin: '0 0 16px', letterSpacing: '0.05em' }}>The Logbook.</h1>
        <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 32, maxWidth: 600 }}>
          Every recorded race. Challenge results are public by default. Practice runs only show
          if the driver chose to save them.
        </p>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <FilterPill label="ALL TYPES" active={!sp.type} href="/race/history" />
          {Object.entries(RACE_LABEL).map(([k, v]) => (
            <FilterPill
              key={k}
              label={v.toUpperCase()}
              active={sp.type === k}
              href={`/race/history?type=${k}${sp.user ? '&user=' + sp.user : ''}`}
            />
          ))}
        </div>

        {sp.user && (
          <div style={{ marginBottom: 24, fontSize: 13, color: colors.textMuted }}>
            Showing races involving <span style={{ color: colors.accent }}>@{sp.user}</span>{' '}
            <Link href={`/race/history${sp.type ? '?type=' + sp.type : ''}`} style={{ color: colors.textMuted, marginLeft: 8 }}>
              [clear]
            </Link>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="ug-card" style={{ textAlign: 'center', padding: 48, color: colors.textMuted }}>
            No races logged yet. Be the first.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map((r) => {
              const challengerWon = r.winnerVehicleId === r.challengerVehicleId;
              const tie = !r.winnerVehicleId;
              return (
                <Link
                  key={r.id}
                  href={`/race/result/${r.id}`}
                  className="ug-card"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr auto',
                    gap: 16,
                    padding: '14px 20px',
                    color: colors.text,
                    textDecoration: 'none',
                    fontFamily: fonts.mono,
                    alignItems: 'center',
                  }}
                >
                  <Side
                    callsign={r.chalCallsign}
                    isAdmin={r.chalAdmin ?? false}
                    label={r.chalVehicleLabel ?? 'Unknown'}
                    won={challengerWon}
                    tie={tie}
                  />
                  <div style={{ fontSize: 14, color: colors.accent, fontWeight: 700 }}>VS</div>
                  <Side
                    callsign={r.oppCallsign}
                    isAdmin={r.oppAdmin ?? false}
                    label={r.oppVehicleLabel ?? 'Unknown'}
                    won={!challengerWon && !tie}
                    tie={tie}
                    rightAlign
                  />
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.3em', color: colors.textMuted }}>
                      {RACE_LABEL[r.raceType]?.toUpperCase()} · {r.source === 'challenge' ? 'CHALLENGE' : 'PRACTICE'}
                    </div>
                    {!tie && r.estimatedGap !== null && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.accent, marginTop: 2 }}>
                        +{r.estimatedGap.toFixed(2)}s
                      </div>
                    )}
                    {tie && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, marginTop: 2 }}>TIE</div>
                    )}
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

function FilterPill({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className="ug-pill ug-mono"
      style={{
        fontSize: 10,
        letterSpacing: '0.3em',
        background: active ? colors.accentSoft : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? colors.accentBorder : colors.border}`,
        color: active ? colors.accent : colors.textMuted,
        textDecoration: 'none',
        fontWeight: 700,
      }}
    >
      {label}
    </Link>
  );
}

function Side({
  callsign,
  isAdmin,
  label,
  won,
  tie,
  rightAlign,
}: {
  callsign: string | null;
  isAdmin: boolean;
  label: string;
  won: boolean;
  tie: boolean;
  rightAlign?: boolean;
}) {
  return (
    <div style={{ textAlign: rightAlign ? 'right' : 'left' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          justifyContent: rightAlign ? 'flex-end' : 'flex-start',
          marginBottom: 2,
        }}
      >
        {won && !tie && <span style={{ color: colors.success, fontSize: 10 }}>✓</span>}
        <span style={{ fontSize: 12, fontWeight: 700, color: won ? colors.success : colors.text }}>
          @{callsign ?? '???'}
        </span>
        {isAdmin && (
          <span
            style={{
              fontSize: 7,
              letterSpacing: '0.2em',
              color: colors.accent,
              border: `1px solid ${colors.accent}`,
              padding: '1px 4px',
            }}
          >
            ADMIN
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: colors.textMuted }}>{label}</div>
    </div>
  );
}
