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
  myUserId: string;
  myCallsign: string | null;
};

export function RaceUI({ myCars, communityCars, myUserId, myCallsign }: Props) {
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

  // Own-garage cars become eligible opponents too (minus whichever one is the challenger).
  const myCarsAsOpponents: CommunityCar[] = useMemo(
    () =>
      myCars
        .filter((c) => c.id !== myCarId)
        .map((c) => ({ ...c, ownerUserId: myUserId, ownerCallsign: myCallsign })),
    [myCars, myCarId, myUserId, myCallsign],
  );

  const myCar = useMemo(() => myCars.find((c) => c.id === myCarId) ?? null, [myCars, myCarId]);
  const oppCar = useMemo(() => {
    if (!oppCarId) return null;
    return (
      myCarsAsOpponents.find((c) => c.id === oppCarId) ??
      communityCars.find((c) => c.id === oppCarId) ??
      null
    );
  }, [oppCarId, myCarsAsOpponents, communityCars]);

  const oppIsMine = oppCar?.ownerUserId === myUserId;

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
        raceType={raceType}
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
          {!oppIsMine && (
            <button
              onClick={() => { setMode('challenge'); setStage('pick'); setAnimCars(null); setResultData(null); }}
              style={styles.buttonPrimary}
            >
              CHALLENGE THIS DRIVER
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="race-segmented race-rise" style={{ marginBottom: 14, animationDelay: '40ms' }}>
        <button
          type="button"
          data-active={mode === 'practice'}
          onClick={() => setMode('practice')}
        >
          Practice
        </button>
        <button
          type="button"
          data-active={mode === 'challenge'}
          onClick={() => setMode('challenge')}
        >
          Challenge a driver
        </button>
      </div>

      <div
        className="race-rise"
        style={{
          fontSize: 14,
          color: 'rgba(245, 246, 247, 0.55)',
          marginBottom: 48,
          maxWidth: 620,
          lineHeight: 1.55,
          animationDelay: '80ms',
        }}
      >
        {mode === 'practice'
          ? 'Pick any vehicle to race against. Results are for your eyes only — nothing is saved unless you choose to.'
          : 'Send a formal challenge. Your opponent gets a notification; either party can hit start to watch the race live.'}
      </div>

      <Section number="01" title="Your car" delay={120}>
        <CarGrid cars={myCars} selectedId={myCarId} onSelect={setMyCarId} />
      </Section>

      <Section number="02" title="Opponent" delay={180}>
        {myCarsAsOpponents.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SubLabel>From your garage</SubLabel>
            <CarGrid
              cars={myCarsAsOpponents}
              selectedId={oppCarId}
              onSelect={setOppCarId}
              mineBadge
            />
          </div>
        )}
        <SubLabel>Community</SubLabel>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by callsign, make, or model…"
          style={{ ...styles.input, marginBottom: 16, maxWidth: 420 }}
        />
        <CarGrid cars={filteredOpponents} selectedId={oppCarId} onSelect={setOppCarId} showCallsign />
      </Section>

      <Section number="03" title="Race type" delay={240}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {RACE_TYPES.map((rt) => (
            <button
              key={rt.value}
              type="button"
              className="race-pill"
              data-selected={raceType === rt.value}
              onClick={() => setRaceType(rt.value)}
            >
              <span>{rt.label}</span>
              <span className="race-pill-sub">{rt.sublabel}</span>
            </button>
          ))}
        </div>
      </Section>

      {mode === 'challenge' && (
        <Section number="04" title="Message" subtitle="Optional" delay={280}>
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
        <div
          style={{
            padding: '12px 16px',
            border: `1px solid ${colors.accentBorder}`,
            background: 'rgba(255, 42, 42, 0.08)',
            color: '#ffb3b3',
            borderRadius: 12,
            fontSize: 13,
            marginBottom: 20,
            maxWidth: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        className="race-rise"
        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animationDelay: '320ms' }}
      >
        {mode === 'practice' ? (
          <button
            type="button"
            onClick={runPractice}
            disabled={!myCarId || !oppCarId || submitting}
            style={{
              ...styles.buttonPrimary,
              opacity: !myCarId || !oppCarId || submitting ? 0.45 : 1,
              fontSize: 13,
              padding: '16px 28px',
              borderRadius: 999,
              transition: 'transform 160ms ease, opacity 160ms ease',
            }}
          >
            {submitting ? 'Calculating…' : 'Run the race  →'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={submitChallenge}
              disabled={!myCarId || !oppCarId || submitting || oppIsMine}
              style={{
                ...styles.buttonPrimary,
                opacity: !myCarId || !oppCarId || submitting || oppIsMine ? 0.45 : 1,
                fontSize: 13,
                padding: '16px 28px',
                borderRadius: 999,
                transition: 'transform 160ms ease, opacity 160ms ease',
              }}
            >
              {submitting ? 'Sending…' : 'Send challenge  →'}
            </button>
            {oppIsMine && (
              <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
                Can&apos;t challenge yourself — use practice to race your own cars.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: '0.28em',
        color: 'rgba(245, 246, 247, 0.42)',
        fontFamily: fonts.mono,
        fontWeight: 600,
        textTransform: 'uppercase',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Section({
  number,
  title,
  subtitle,
  delay,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="race-rise"
      style={{ marginBottom: 44, animationDelay: delay ? `${delay}ms` : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <span className="race-step-num">{number}</span>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: '#f5f6f7',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <span
            style={{
              fontSize: 11,
              color: 'rgba(245, 246, 247, 0.42)',
              fontFamily: fonts.mono,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginLeft: 4,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CarGrid({
  cars, selectedId, onSelect, showCallsign, mineBadge,
}: {
  cars: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showCallsign?: boolean;
  mineBadge?: boolean;
}) {
  if (cars.length === 0) {
    return (
      <div
        style={{
          color: colors.textMuted,
          fontSize: 13,
          padding: '18px 20px',
          border: `1px dashed ${colors.border}`,
          borderRadius: 12,
        }}
      >
        No vehicles available.
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))',
        gap: 12,
        maxHeight: 380,
        overflowY: 'auto',
        paddingRight: 4,
      }}
    >
      {cars.map((c) => {
        const selected = selectedId === c.id;
        const tagline = c.ownerCallsign && showCallsign ? `@${c.ownerCallsign}` : mineBadge ? 'In your garage' : null;
        return (
          <button
            key={c.id}
            type="button"
            className="race-pick"
            data-selected={selected}
            onClick={() => onSelect(c.id)}
          >
            {c.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.thumbUrl}
                alt=""
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 10,
                  flexShrink: 0,
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              {tagline && (
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.24em',
                    color: mineBadge ? 'rgba(245,246,247,0.55)' : colors.accent,
                    fontFamily: fonts.mono,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}
                >
                  {tagline}
                </div>
              )}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}
              >
                {c.year} {c.make} {c.model}
              </div>
              {c.trim && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(245, 246, 247, 0.55)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 2,
                  }}
                >
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
