// components/race/RaceResultCard.tsx
//
// Final result card displayed after the animation completes (or when
// viewing a saved result).

import { colors, fonts } from '@/lib/design';
import { RaceTicket } from './RaceTicket';

type Props = {
  challengerLabel: string;
  challengerCallsign?: string | null;
  opponentLabel: string;
  opponentCallsign?: string | null;
  winner: 'challenger' | 'opponent' | 'tie';
  raceType: string;
  estimatedGap: number;
  challengerEt: number | null;
  opponentEt: number | null;
  challengerTrap: number | null;
  opponentTrap: number | null;
  summary: string;
  source?: 'challenge' | 'practice';
};

const RACE_LABELS: Record<string, string> = {
  zero_sixty: '0–60 SPRINT',
  quarter_mile: 'QUARTER MILE',
  half_mile: 'HALF MILE',
  roll_40_140: '40–140 ROLL',
  highway_pull: 'HIGHWAY PULL',
  dig: 'DIG RACE',
  overall: 'OVERALL',
};

export function RaceResultCard({
  challengerLabel,
  challengerCallsign,
  opponentLabel,
  opponentCallsign,
  winner,
  raceType,
  estimatedGap,
  challengerEt,
  opponentEt,
  challengerTrap,
  opponentTrap,
  summary,
  source,
}: Props) {
  const isTie = winner === 'tie';
  const challengerWon = winner === 'challenger';

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      <div
        className={isTie ? 'ug-card' : 'ug-glass-tinted'}
        style={{
          padding: '28px 32px',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <div className="ug-mono" style={{ fontSize: 11, letterSpacing: '0.5em', color: colors.accent, marginBottom: 8 }}>
          ∕∕ {RACE_LABELS[raceType] ?? raceType.toUpperCase()}
          {source && (
            <span style={{ marginLeft: 16, color: colors.textMuted }}>
              · {source === 'challenge' ? 'CHALLENGE' : 'PRACTICE'}
            </span>
          )}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.05em' }}>
          {isTie
            ? 'DEAD HEAT'
            : `${challengerWon ? challengerCallsign ?? challengerLabel : opponentCallsign ?? opponentLabel} WINS`}
        </div>
        {!isTie && (
          <div className="ug-mono" style={{ fontSize: 12, color: colors.textMuted, marginTop: 8, letterSpacing: '0.2em' }}>
            BY {estimatedGap < 0.2 ? 'A FENDER' : `${estimatedGap.toFixed(2)} SECONDS`}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SideCard
          label={challengerLabel}
          callsign={challengerCallsign}
          et={challengerEt}
          trap={challengerTrap}
          isWinner={challengerWon && !isTie}
        />
        <SideCard
          label={opponentLabel}
          callsign={opponentCallsign}
          et={opponentEt}
          trap={opponentTrap}
          isWinner={!challengerWon && !isTie}
        />
      </div>

      <div className="ug-card" style={{ marginTop: 16, padding: 24 }}>
        <div className="ug-label">SUMMARY</div>
        <div style={{ fontSize: 14, color: colors.text, lineHeight: 1.7 }}>{summary}</div>
        <div style={{ fontSize: 10, color: colors.textDim, marginTop: 16, fontStyle: 'italic' }}>
          Estimates only — based on power-to-weight, drivetrain, transmission, and tires.
          Real outcomes vary with driver, weather, surface, and the day's vibe.
        </div>
      </div>
      <RaceTicket
        challengerLabel={challengerLabel}
        challengerCallsign={challengerCallsign}
        opponentLabel={opponentLabel}
        opponentCallsign={opponentCallsign}
        challengerEt={challengerEt}
        opponentEt={opponentEt}
        challengerTrap={challengerTrap}
        opponentTrap={opponentTrap}
        raceType={raceType}
      />
    </div>
  );
}

function SideCard({
  label,
  callsign,
  et,
  trap,
  isWinner,
}: {
  label: string;
  callsign?: string | null;
  et: number | null;
  trap: number | null;
  isWinner: boolean;
}) {
  return (
    <div
      className="ug-card"
      style={{
        padding: 20,
        borderColor: isWinner ? colors.accentBorder : undefined,
        boxShadow: isWinner ? '0 0 24px rgba(255, 42, 42, 0.18), inset 0 1px 0 rgba(255,255,255,0.06)' : undefined,
      }}
    >
      {callsign && (
        <div className="ug-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: colors.accent, marginBottom: 4 }}>
          @{callsign}
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ display: 'flex', gap: 16 }}>
        {et !== null && (
          <div>
            <div className="ug-mono" style={{ fontSize: 9, letterSpacing: '0.3em', color: colors.textDim }}>ET</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fonts.mono }}>
              {et.toFixed(2)}
              <span style={{ fontSize: 11, marginLeft: 4, color: colors.textMuted }}>s</span>
            </div>
          </div>
        )}
        {trap !== null && (
          <div>
            <div className="ug-mono" style={{ fontSize: 9, letterSpacing: '0.3em', color: colors.textDim }}>TRAP</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: fonts.mono }}>
              {trap.toFixed(0)}
              <span style={{ fontSize: 11, marginLeft: 4, color: colors.textMuted }}>mph</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
