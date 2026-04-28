// components/race/RaceAnimation.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { colors, fonts } from '@/lib/design';

/**
 * Animated drag-strip simulation. Plays a light tree, then runs both cars
 * down a quarter mile in real time with believable physics.
 *
 * Physics model: distance(t) = ½·a·t² for each car, where `a` is derived
 * from the calculated quarter-mile ET. This produces a parabolic position
 * curve — slow start, accelerating gap. Drivetrain advantages show up as
 * a head-start on launch (added to t for the slower-launching car).
 */

export type AnimationCar = {
  label: string;
  estimatedEt: number;          // seconds (the calculated 1/4 mile ET)
  estimatedTrapSpeed: number;   // mph
  drivetrain: string;
  callsign?: string;
};

type Props = {
  challenger: AnimationCar;
  opponent: AnimationCar;
  /** Called when the animation completes. */
  onFinish?: () => void;
  /** Auto-start vs wait for click. Default: false. */
  autoStart?: boolean;
};

type Phase = 'idle' | 'pre_stage' | 'stage' | 'amber_1' | 'amber_2' | 'amber_3' | 'green' | 'racing' | 'finished';

const QUARTER_MILE_FT = 1320;

export function RaceAnimation({ challenger, opponent, onFinish, autoStart = false }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [cPos, setCPos] = useState(0); // 0-1 position along the strip
  const [oPos, setOPos] = useState(0);
  const [cMph, setCMph] = useState(0);
  const [oMph, setOMph] = useState(0);
  const [cElapsed, setCElapsed] = useState<number | null>(null);
  const [oElapsed, setOElapsed] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Launch advantage: AWD launches harder than RWD launches harder than FWD.
  // We model this as a small head-start (in seconds) for the better-launching car.
  const launchHeadStart = (() => {
    const dvBonus: Record<string, number> = { AWD: 0.15, '4WD': 0.12, RWD: 0.06, FWD: 0.0, UNKNOWN: 0.06 };
    const c = dvBonus[challenger.drivetrain] ?? 0.06;
    const o = dvBonus[opponent.drivetrain] ?? 0.06;
    return { challenger: c, opponent: o };
  })();

  // Compute acceleration from ET. d = ½·a·t² → a = 2d/t²
  const cAccel = (2 * QUARTER_MILE_FT) / (challenger.estimatedEt * challenger.estimatedEt);
  const oAccel = (2 * QUARTER_MILE_FT) / (opponent.estimatedEt * opponent.estimatedEt);

  useEffect(() => {
    if (autoStart) startSequence();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  function startSequence() {
    if (phase !== 'idle' && phase !== 'finished') return;
    setCPos(0);
    setOPos(0);
    setCMph(0);
    setOMph(0);
    setCElapsed(null);
    setOElapsed(null);

    setPhase('pre_stage');
    setTimeout(() => setPhase('stage'), 800);
    setTimeout(() => setPhase('amber_1'), 1600);
    setTimeout(() => setPhase('amber_2'), 2100);
    setTimeout(() => setPhase('amber_3'), 2600);
    setTimeout(() => {
      setPhase('green');
      setTimeout(() => {
        setPhase('racing');
        startRace();
      }, 350);
    }, 3100);
  }

  function startRace() {
    startTimeRef.current = performance.now();
    let cFin: number | null = null;
    let oFin: number | null = null;
    let bothDone = false;

    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000; // seconds since green

      // Each car's effective time on the strip = elapsed - (their late-launch delay).
      // The faster-launching car "starts" sooner.
      const maxHs = Math.max(launchHeadStart.challenger, launchHeadStart.opponent);
      const cT = Math.max(0, elapsed - (maxHs - launchHeadStart.challenger));
      const oT = Math.max(0, elapsed - (maxHs - launchHeadStart.opponent));

      // Position in feet (capped at QUARTER_MILE_FT)
      const cFt = Math.min(QUARTER_MILE_FT, 0.5 * cAccel * cT * cT);
      const oFt = Math.min(QUARTER_MILE_FT, 0.5 * oAccel * oT * oT);

      setCPos(cFt / QUARTER_MILE_FT);
      setOPos(oFt / QUARTER_MILE_FT);

      // Live mph: v = a·t, converted to mph (ft/s → mph: ×0.6818)
      setCMph(Math.min(challenger.estimatedTrapSpeed, cAccel * cT * 0.6818));
      setOMph(Math.min(opponent.estimatedTrapSpeed, oAccel * oT * 0.6818));

      // Detect each car finishing
      if (cFin === null && cFt >= QUARTER_MILE_FT) {
        cFin = cT;
        setCElapsed(cT);
      }
      if (oFin === null && oFt >= QUARTER_MILE_FT) {
        oFin = oT;
        setOElapsed(oT);
      }

      if (cFin !== null && oFin !== null) {
        if (!bothDone) {
          bothDone = true;
          setPhase('finished');
          // Wait a beat before calling onFinish so the result-bar has time to register
          setTimeout(() => onFinish?.(), 1200);
        }
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      {/* Light tree */}
      <LightTree phase={phase} />

      {/* Strip */}
      <div
        style={{
          position: 'relative',
          background: '#0d0d0d',
          border: `0.5px solid ${colors.border}`,
          padding: '24px 0',
          marginTop: 24,
          overflow: 'hidden',
        }}
      >
        {/* Distance markers */}
        <DistanceMarkers />

        {/* Challenger lane */}
        <Lane
          label={challenger.label}
          callsign={challenger.callsign}
          position={cPos}
          mph={cMph}
          elapsed={cElapsed}
          finished={cElapsed !== null}
          isLeading={cPos > oPos && phase === 'racing'}
        />

        <div style={{ height: 8 }} />

        <Lane
          label={opponent.label}
          callsign={opponent.callsign}
          position={oPos}
          mph={oMph}
          elapsed={oElapsed}
          finished={oElapsed !== null}
          isLeading={oPos > cPos && phase === 'racing'}
        />
      </div>

      {!autoStart && phase === 'idle' && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={startSequence}
            style={{
              background: colors.accent,
              color: '#fff',
              border: 'none',
              padding: '16px 32px',
              fontSize: 14,
              letterSpacing: '0.3em',
              fontFamily: fonts.mono,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            START THE RACE
          </button>
        </div>
      )}

      {phase === 'finished' && (
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, letterSpacing: '0.3em', color: colors.textMuted }}>
          // CLOCKED //
        </div>
      )}
    </div>
  );
}

// ── Light tree ────────────────────────────────────────────────────────────

function LightTree({ phase }: { phase: Phase }) {
  const preStage = phase === 'pre_stage' || phase === 'stage' || phase === 'amber_1' || phase === 'amber_2' || phase === 'amber_3' || phase === 'green' || phase === 'racing' || phase === 'finished';
  const stage = phase === 'stage' || phase === 'amber_1' || phase === 'amber_2' || phase === 'amber_3' || phase === 'green' || phase === 'racing' || phase === 'finished';
  const amber1 = phase === 'amber_1' || phase === 'amber_2' || phase === 'amber_3' || phase === 'green';
  const amber2 = phase === 'amber_2' || phase === 'amber_3' || phase === 'green';
  const amber3 = phase === 'amber_3' || phase === 'green';
  const green = phase === 'green' || phase === 'racing' || phase === 'finished';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 64,
        padding: '24px 0',
        background: '#000',
        border: `0.5px solid ${colors.border}`,
      }}
    >
      {/* Left tree */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        <Bulb on={preStage} color="#ffe680" size="small" />
        <Bulb on={stage} color="#ffe680" size="small" />
        <div style={{ height: 8 }} />
        <Bulb on={amber1} color="#ffaa30" size="big" />
        <Bulb on={amber2} color="#ffaa30" size="big" />
        <Bulb on={amber3} color="#ffaa30" size="big" />
        <Bulb on={green} color="#4ade80" size="big" />
      </div>

      {/* Right tree mirrors left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        <Bulb on={preStage} color="#ffe680" size="small" />
        <Bulb on={stage} color="#ffe680" size="small" />
        <div style={{ height: 8 }} />
        <Bulb on={amber1} color="#ffaa30" size="big" />
        <Bulb on={amber2} color="#ffaa30" size="big" />
        <Bulb on={amber3} color="#ffaa30" size="big" />
        <Bulb on={green} color="#4ade80" size="big" />
      </div>
    </div>
  );
}

function Bulb({ on, color, size }: { on: boolean; color: string; size: 'small' | 'big' }) {
  const dim = size === 'big' ? 28 : 14;
  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: on ? color : '#1a1a1a',
        boxShadow: on
          ? `0 0 ${size === 'big' ? 24 : 12}px ${color}, 0 0 4px ${color} inset`
          : 'none',
        border: `1px solid ${on ? color : '#222'}`,
        transition: 'all 50ms linear',
      }}
    />
  );
}

// ── Lane ──────────────────────────────────────────────────────────────────

function Lane({
  label,
  callsign,
  position,
  mph,
  elapsed,
  finished,
  isLeading,
}: {
  label: string;
  callsign?: string;
  position: number;   // 0 to 1
  mph: number;
  elapsed: number | null;
  finished: boolean;
  isLeading: boolean;
}) {
  return (
    <div style={{ position: 'relative', height: 48, padding: '0 16px' }}>
      {/* Lane background */}
      <div
        style={{
          position: 'absolute',
          inset: '0 16px',
          background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 40px, transparent 40px 80px)',
          borderTop: `0.5px dashed ${colors.border}`,
          borderBottom: `0.5px dashed ${colors.border}`,
        }}
      />

      {/* Label on left */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 4,
          fontSize: 10,
          letterSpacing: '0.2em',
          fontFamily: fonts.mono,
          color: isLeading ? colors.accent : colors.textMuted,
          fontWeight: 700,
          background: '#0d0d0d',
          padding: '0 6px',
        }}
      >
        {callsign ? `${callsign} · ` : ''}{label}
      </div>

      {/* Live mph + elapsed on right */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          top: 4,
          fontSize: 10,
          letterSpacing: '0.2em',
          fontFamily: fonts.mono,
          color: finished ? colors.success : colors.textMuted,
          background: '#0d0d0d',
          padding: '0 6px',
        }}
      >
        {finished && elapsed !== null
          ? `${elapsed.toFixed(2)}s @ ${mph.toFixed(0)} mph`
          : `${mph.toFixed(0)} mph`}
      </div>

      {/* Car icon */}
      <div
        style={{
          position: 'absolute',
          left: `calc(16px + ${position * 100}% - ${position * 32}px)`,
          top: 18,
          fontSize: 22,
          transition: 'none',
          textShadow: isLeading ? `0 0 12px ${colors.accent}` : 'none',
          willChange: 'left',
          transform: 'scaleX(-1)',
        }}
      >
        🏎️
      </div>

      {/* Finish line on far right */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          top: 0,
          bottom: 0,
          width: 2,
          background: '#fff',
          opacity: 0.4,
        }}
      />
    </div>
  );
}

function DistanceMarkers() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}
    >
      {[0, 60, 330, 660, 1000, 1320].map((ft) => (
        <div
          key={ft}
          style={{
            fontSize: 8,
            color: colors.textDim,
            letterSpacing: '0.2em',
            fontFamily: fonts.mono,
            alignSelf: 'flex-start',
            marginTop: 4,
          }}
        >
          {ft === 0 ? 'START' : ft === 1320 ? '1/4' : `${ft}'`}
        </div>
      ))}
    </div>
  );
}
