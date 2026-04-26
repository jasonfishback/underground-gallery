// components/race/ChallengeInbox.tsx
//
// A compact banner of pending incoming challenges. Each row links to
// /race/challenge/[id] where the user can accept/decline.

import { styles, colors, fonts } from '@/lib/design';
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
      style={{
        marginBottom: 32,
        padding: 24,
        background: colors.accentSoft,
        border: `1px solid ${colors.accent}`,
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
          <div style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, fontWeight: 700 }}>
            INCOMING CHALLENGES
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
            {challenges.length} pending
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {challenges.map((c) => {
          const carLabel = `${c.challengerVehicleYear} ${c.challengerVehicleMake} ${c.challengerVehicleModel}`;
          return (
            <Link
              key={c.id}
              href={`/race/challenge/${c.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 16px',
                background: colors.bg,
                border: `0.5px solid ${colors.border}`,
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
                style={{
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  color: colors.accent,
                  border: `0.5px solid ${colors.accent}`,
                  padding: '6px 12px',
                  whiteSpace: 'nowrap',
                }}
              >
                RESPOND →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
