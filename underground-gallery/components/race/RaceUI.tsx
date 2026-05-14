// components/race/RaceUI.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { runPracticeRace, createChallenge } from '@/app/race/actions';
import { RaceAnimation, type AnimationCar } from './RaceAnimation';
import { RaceResultCard } from './RaceResultCard';
import { styles, colors, fonts } from '@/lib/design';

type Car = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  thumbUrl?: string | null;
  isPrimary?: boolean;
};

type CommunityCar = Car & {
  ownerUserId: string;
  ownerCallsign: string | null;
};

type RaceType =
  | 'zero_sixty' | 'quarter_mile' | 'half_mile'
  | 'roll_40_140' | 'highway_pull' | 'dig' | 'overall';

const RACE_TYPES: { value: RaceType; label: string; sublabel: string }[] = [
  { value: 'quarter_mile', label: '¼ Mile',  sublabel: 'Drag strip classic' },
  { value: 'dig',          label: 'Dig',     sublabel: 'Standing start' },
  { value: 'roll_40_140',  label: 'Roll',    sublabel: '40–140 mph' },
  { value: 'zero_sixty',   label: '0–60',    sublabel: 'Sprint' },
  { value: 'half_mile',    label: '½ Mile',  sublabel: 'Top-end' },
  { value: 'highway_pull', label: 'Highway', sublabel: 'Sustained pull' },
  { value: 'overall',      label: 'Overall', sublabel: 'All-around' },
];

type Mode = 'practice' | 'challenge';

type Props = {
  myCars: Car[];
  communityCars: CommunityCar[];
};

export function RaceUI({ myCars, communityCars }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('practice');
  const [myCarId, setMyCarId] = useState<string | null>(myCars[0]?.id ?? null);
  const [oppCarId, setOppCarId] = useState<string | null>(null);
  const [raceType, setRaceType] = useState<RaceType>('quarter_mile');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const [stage, setStage] = useState<'pick' | 'animate' | 'done'>('pick');
  const [animCars, setAnimCars] = useState<{ challenger: AnimationCar; opponent: AnimationCar } | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myCar = useMemo(() => myCars.find((c) => c.id === myCarId) ?? null, [myCars, myCarId]);
  const oppCar = useMemo(() => communityCars.find((c) => c.id === oppCarId) ?? null, [communityCars, oppCarId]);

  const filteredOpponents = useMemo(() => {
    if (!search.trim()) return communityCars.slice(0, 60);
    const s = search.toLowerCase();
    return communityCars.filter(
      (c) =>
        `${c.year} ${c.make} ${c.model} ${c.trim ?? ''}`.toLowerCase().includes(s) ||
        (c.ownerCallsign ?? '').toLowerCase().includes(s),
    );
  }, [communityCars, search]);

  if (myCars.length === 0) {
    return (
      <div style={{ ...styles.panel, textAlign: 'center', padding: 64 }}>
        <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 16 }}>
          You need to add a vehicle before you can race.
        </div>
        <button onClick={() => router.push('/me')} style={styles.buttonPrimary}>
          GO TO YOUR GARAGE
        </button>
      </div>
    );
  }

  async function runPractice() {
    if (!myCarId || !oppCarId) {
      setError('Pick both cars');
      return;
    }
    setSubmitting(true);
    setError(null);
    const r = await runPracticeRace({
      challengerVehicleId: myCarId,
      opponentVehicleId: oppCarId,
      raceType,
      saveResult: false,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    const data = (r as any).data.result;
    const result = data.result;
    setResultData({
      result,
      challengerLabel: `${myCar!.year} ${myCar!.make} ${myCar!.model}${myCar!.trim ? ' ' + myCar!.trim : ''}`,
      opponentLabel: `${oppCar!.year} ${oppCar!.make} ${oppCar!.model}${oppCar!.trim ? ' ' + oppCar!.trim : ''}`,
      opponentCallsign: oppCar!.ownerCallsign,
    });
    setAnimCars({
      challenger: {
        label: `${myCar!.make} ${myCar!.model}`,
        estimatedEt: result.details.challenger.estimatedQuarterMile,
        estimatedTrapSpeed: result.details.challenger.estimatedTrapSpeed,
        estimatedTopSpeed: result.details.challenger.estimatedTopSpeed,
        drivetrain: data.chalBuild.drivetrain,
        callsign: 'YOU',
        thumbUrl: myCar!.thumbUrl ?? null,
      },
      opponent: {
        label: `${oppCar!.make} ${oppCar!.model}`,
        estimatedEt: result.details.opponent.estimatedQuarterMile,
        estimatedTrapSpeed: result.details.opponent.estimatedTrapSpeed,
        estimatedTopSpeed: result.details.opponent.estimatedTopSpeed,
        drivetrain: data.oppBuild.drivetrain,
        callsign: oppCar!.ownerCallsign ?? undefined,
        thumbUrl: oppCar!.thumbUrl ?? null,
      },
    });
    setStage('animate');
  }

  async function submitChallenge() {
    if (!myCarId || !oppCarId || !oppCar) {
      setError('Pick both cars');
      return;
    }
    setSubmitting(true);
    setError(null);
    const r = await createChallenge({
      challengerVehicleId: myCarId,
      opponentUserId: oppCar.ownerUserId,
      opponentVehicleId: oppCarId,
      raceType,
      message: message || undefined,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.push(`/race/challenge/${(r as any).data.challengeId}?sent=1`);
  }

  if (stage === 'animate' && animCars) {
    return (
      <RaceAnimation
        challenger={animCars.challenger}
        opponent={animCars.opponent}
        autoStart
        onFinish={() => setStage('done')}
      />
    );
  }

  if (stage === 'done' && resultData) {
    return (
      <div>
        <RaceResultCard
          challengerLabel={resultData.challengerLabel}
          challengerCallsign="YOU"
          opponentLabel={resultData.opponentLabel}
          opponentCallsign={resultData.opponentCallsign}
          winner={resultData.result.winner}
          raceType={raceType}
          estimatedGap={resultData.result.estimatedGap}
          challengerEt={resultData.result.challengerEt}
          opponentEt={resultData.result.opponentEt}
          challengerTrap={resultData.result.challengerTrap}
          opponentTrap={resultData.result.opponentTrap}
          summary={resultData.result.summary}
          source="practice"
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={() => { setStage('pick'); setAnimCars(null); setResultData(null); }}
            style={styles.buttonGhost}
          >
            ← RACE AGAIN
          </button>
          <button
            onClick={() => { setMode('challenge'); setStage('pick'); setAnimCars(null); setResultData(null); }}
            style={styles.buttonPrimary}
          >
            CHALLENGE THIS DRIVER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, maxWidth: 480 }}>
        <ModeButton active={mode === 'practice'} onClick={() => setMode('practice')}>PRACTICE</ModeButton>
        <ModeButton active={mode === 'challenge'} onClick={() => setMode('challenge')}>CHALLENGE A DRIVER</ModeButton>
      </div>

      <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 24, maxWidth: 600 }}>
        {mode === 'practice'
          ? 'Pick any vehicle to race against. Result is for your eyes only — nothing is saved unless you choose to.'
          : 'Send a formal challenge. Opponent gets a notification, accepts, and either party can hit "start" to watch the race live together.'}
      </div>

      <Section title="STEP 1 · YOUR CAR">
        <CarGrid cars={myCars} selectedId={myCarId} onSelect={setMyCarId} />
      </Section>

      <Section title="STEP 2 · OPPONENT">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by callsign, make, or model…"
          style={{ ...styles.input, marginBottom: 16, maxWidth: 400 }}
        />
        <CarGrid cars={filteredOpponents} selectedId={oppCarId} onSelect={setOppCarId} showCallsign />
      </Section>

      <Section title="STEP 3 · RACE TYPE">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {RACE_TYPES.map((rt) => (
            <button
              key={rt.value}
              onClick={() => setRaceType(rt.value)}
              style={{
                padding: '14px 16px',
                background: raceType === rt.value ? colors.accentSoft : 'transparent',
                border: `0.5px solid ${raceType === rt.value ? colors.accentBorder : colors.border}`,
                color: raceType === rt.value ? colors.accent : colors.text,
                fontFamily: fonts.mono,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em' }}>{rt.label}</div>
              <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{rt.sublabel}</div>
            </button>
          ))}
        </div>
      </Section>

      {mode === 'challenge' && (
        <Section title="STEP 4 · MESSAGE (OPTIONAL)">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Trash talk, terms, or just leave it blank…"
            maxLength={500}
            style={{ ...styles.input, maxWidth: 600 }}
          />
        </Section>
      )}

      {error && (
        <div style={{ padding: '10px 14px', border: `0.5px solid ${colors.accent}`, color: colors.accent, fontSize: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        {mode === 'practice' ? (
          <button
            onClick={runPractice}
            disabled={!myCarId || !oppCarId || submitting}
            style={{
              ...styles.buttonPrimary,
              opacity: !myCarId || !oppCarId || submitting ? 0.4 : 1,
              fontSize: 14,
              padding: '16px 32px',
            }}
          >
            {submitting ? 'CALCULATING…' : 'RUN THE RACE →'}
          </button>
        ) : (
          <button
            onClick={submitChallenge}
            disabled={!myCarId || !oppCarId || submitting}
            style={{
              ...styles.buttonPrimary,
              opacity: !myCarId || !oppCarId || submitting ? 0.4 : 1,
              fontSize: 14,
              padding: '16px 32px',
            }}
          >
            {submitting ? 'SENDING…' : 'SEND CHALLENGE →'}
          </button>
        )}
      </div>
    </div>
  );
}

function ModeButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        background: active ? colors.accentSoft : 'transparent',
        border: `0.5px solid ${active ? colors.accentBorder : colors.border}`,
        color: active ? colors.accent : colors.textMuted,
        fontFamily: fonts.mono,
        fontSize: 11,
        letterSpacing: '0.2em',
        cursor: 'pointer',
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function CarGrid({
  cars, selectedId, onSelect, showCallsign,
}: {
  cars: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showCallsign?: boolean;
}) {
  if (cars.length === 0) {
    return <div style={{ color: colors.textMuted, fontSize: 13, padding: 16 }}>No vehicles available.</div>;
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 8,
        maxHeight: 320,
        overflowY: 'auto',
        padding: 4,
      }}
    >
      {cars.map((c) => {
        const selected = selectedId === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              padding: 12,
              background: selected ? colors.accentSoft : 'transparent',
              border: `0.5px solid ${selected ? colors.accentBorder : colors.border}`,
              color: colors.text,
              fontFamily: fonts.mono,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {c.thumbUrl ? (
              <img src={c.thumbUrl} alt="" style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 48, height: 48, background: '#1a1a1a', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              {showCallsign && c.ownerCallsign && (
                <div style={{ fontSize: 9, letterSpacing: '0.25em', color: colors.accent, marginBottom: 2 }}>
                  @{c.ownerCallsign}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.year} {c.make} {c.model}
              </div>
              {c.trim && (
                <div style={{ fontSize: 10, color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.trim}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
