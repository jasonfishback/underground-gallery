// components/race/ChallengeInbox.tsx
//
// A compact banner of pending incoming challenges. Each row links to
// /race/challenge/[id] where the user can accept/decline.

import { colors, fonts } from '@/lib/design';
import Link from 'next/link';

type InboxItem = {
  id: string;
  raceType: string;
  message: string | null;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  challengerCallsign: string | null;
  challengerVehicleYear: number;
  challengerVehicleMake: string;
  challengerVehicleModel: string;
};

const RACE_LABEL: Record<string, string> = {
  zero_sixty: '0–60',
  quarter_mile: '¼ mile',
  half_mile: '½ mile',
  roll_40_140: '40–140 roll',
  highway_pull: 'highway pull',
  dig: 'dig race',
  overall: 'overall',
};

export function ChallengeInbox({ challenges }: { challenges: InboxItem[] }) {
  return (
    <div
      className="ug-glass-tinted"
      style={{
        marginBottom: 32,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div className="ug-mono" style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, fontWeight: 700 }}>
            ∕∕ INCOMING CHALLENGES
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
            {challenges.length} pending
          </div>
        </div>
      </div>

      <ul className="ug-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {challenges.map((c) => {
          const carLabel = `${c.challengerVehicleYear} ${c.challengerVehicleMake} ${c.challengerVehicleModel}`;
          return (
            <li key={c.id}>
              <Link
                href={`/race/challenge/${c.id}`}
                className="ug-list-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  color: colors.text,
                  textDecoration: 'none',
                  fontFamily: fonts.mono,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: colors.accent }}>@{c.challengerCallsign ?? '???'}</span>
                    <span style={{ color: colors.textMuted, fontSize: 11, margin: '0 8px' }}>·</span>
                    <span>{carLabel}</span>
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    Wants to race in a {RACE_LABEL[c.raceType] ?? c.raceType}
                    {c.message && (
                      <span style={{ marginLeft: 8, fontStyle: 'italic' }}>· "{c.message}"</span>
                    )}
                  </div>
                </div>
                <div
                  className="ug-pill"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.3em',
                    color: colors.accent,
                    border: `1px solid ${colors.accentBorder}`,
                    background: colors.accentSoft,
                    whiteSpace: 'nowrap',
                    fontWeight: 700,
                  }}
                >
                  RESPOND →
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
