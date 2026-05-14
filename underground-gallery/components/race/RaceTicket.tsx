// components/race/RaceTicket.tsx
//
// Dragstrip timeslip-style result ticket. Cream paper, monospace, two
// columns of times. Brand at top + bottom. The off-white surface is
// intentional — this is the "share card" that visually contrasts the
// frosted-glass UI around it, like an actual printed slip.

import { fonts } from '@/lib/design';

type Props = {
  challengerLabel: string;
  challengerCallsign?: string | null;
  opponentLabel: string;
  opponentCallsign?: string | null;
  challengerEt: number | null;   // 1/4 mile ET (sec)
  opponentEt: number | null;
  challengerTrap: number | null; // 1/4 mile trap (mph)
  opponentTrap: number | null;
  raceType: string;
  createdAt?: Date;
};

// Derive intermediate times from a 1/4-mile ET. These ratios are stable
// for street cars in the 7-15 sec range.
function deriveTimes(et: number | null, trap: number | null) {
  if (et == null) return null;
  const rt = 0.5 + Math.random() * 0.4; // simulated reaction time 0.5-0.9
  return {
    rt: rt.toFixed(3),
    sixty: (et * 0.215).toFixed(3),
    threeThirty: (et * 0.50).toFixed(3),
    eighthEt: (et * 0.66).toFixed(3),
    eighthMph: trap != null ? (trap * 0.78).toFixed(2) : '---',
    thousand: (et * 0.83).toFixed(3),
    quarterEt: et.toFixed(3),
    quarterMph: trap != null ? trap.toFixed(2) : '---',
  };
}

export function RaceTicket(props: Props) {
  const c = deriveTimes(props.challengerEt, props.challengerTrap);
  const o = deriveTimes(props.opponentEt, props.opponentTrap);
  const date = (props.createdAt ?? new Date()).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric'
  }).toUpperCase();

  const cName = (props.challengerCallsign ?? props.challengerLabel).toUpperCase();
  const oName = (props.opponentCallsign ?? props.opponentLabel).toUpperCase();

  return (
    <div style={{
      width: '100%',
      maxWidth: 480,
      margin: '24px auto',
      background: '#f5f1e6',
      color: '#1a1a1a',
      fontFamily: fonts.mono,
      fontSize: 13,
      lineHeight: 1.6,
      padding: '28px 32px',
      boxShadow:
        '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 40px -8px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.45)',
      borderRadius: 4,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.4em', fontWeight: 700, marginBottom: 4 }}>
          UNDERGROUND GALLERY
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', color: '#666' }}>
          OFFICIAL TIMESLIP &middot; {date}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '6px 0', marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 8, fontSize: 10, letterSpacing: '0.15em', fontWeight: 700 }}>
          <span></span>
          <span style={{ textAlign: 'right' }}>{cName.length > 12 ? cName.substring(0, 12) : cName}</span>
          <span style={{ textAlign: 'right' }}>{oName.length > 12 ? oName.substring(0, 12) : oName}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 8 }}>
        <Row label="R/T"   left={c?.rt}          right={o?.rt} />
        <Row label="60'"   left={c?.sixty}       right={o?.sixty} />
        <Row label="330'"  left={c?.threeThirty} right={o?.threeThirty} />
        <Row label="1/8"   left={c?.eighthEt}    right={o?.eighthEt} />
        <Row label="MPH"   left={c?.eighthMph}   right={o?.eighthMph} />
        <Row label="1000'" left={c?.thousand}    right={o?.thousand} />
        <Row label="1/4"   left={c?.quarterEt}   right={o?.quarterEt} bold />
        <Row label="MPH"   left={c?.quarterMph}  right={o?.quarterMph} bold />
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px dashed #999', textAlign: 'center', fontSize: 9, letterSpacing: '0.3em', color: '#666' }}>
        UNDERGROUNDGALLERY.AI
      </div>
    </div>
  );
}

function Row({ label, left, right, bold }: { label: string; left?: string; right?: string; bold?: boolean }) {
  return (
    <>
      <span style={{ color: '#666', fontWeight: bold ? 700 : 400 }}>{label} ...</span>
      <span style={{ textAlign: 'right', fontWeight: bold ? 700 : 400 }}>{left ?? '---'}</span>
      <span style={{ textAlign: 'right', fontWeight: bold ? 700 : 400 }}>{right ?? '---'}</span>
    </>
  );
}
