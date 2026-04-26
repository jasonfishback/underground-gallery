// components/race/ResultPageClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { RaceAnimation } from './RaceAnimation';
import { RaceResultCard } from './RaceResultCard';
import { subscribeToRace, unsubscribeFromRace } from '@/lib/pusher/client';
import { toggleRacePublic } from '@/app/race/actions';
import { styles, colors, fonts } from '@/lib/design';

const APP_URL =
  (typeof window !== 'undefined' ? window.location.origin : null) ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://undergroundgallery.ai';

type Props = {
  autoAnimate: boolean;
  /** Unix-ms timestamp when the animation should start. If undefined,
   *  start immediately. Used by Pusher-synced challenge races. */
  startAt?: number;
  /** If this result came from a challenge, subscribe to that channel so
   *  late arrivals can still join the live playback. */
  challengeId: string | null;
  /** Public-share fields. shareSlug present means there's a /r/[slug]
   *  link; isPublic determines whether spectators can actually view it. */
  shareSlug: string | null;
  isPublic: boolean;
  isParticipant: boolean;
  raceResultId: string;
  challengerLabel: string;
  challengerShortLabel: string;
  challengerCallsign: string | null;
  challengerIsAdmin: boolean;
  challengerDrivetrain: string;
  opponentLabel: string;
  opponentShortLabel: string;
  opponentCallsign: string | null;
  opponentIsAdmin: boolean;
  opponentDrivetrain: string;
  winner: 'challenger' | 'opponent' | 'tie';
  raceType: string;
  estimatedGap: number;
  challengerEt: number | null;
  opponentEt: number | null;
  challengerTrap: number | null;
  opponentTrap: number | null;
  summary: string;
  source: 'challenge' | 'practice';
  createdAt: Date;
};

export function ResultPageClient(props: Props) {
  const [stage, setStage] = useState<'waiting' | 'countdown' | 'animate' | 'card'>(
    props.autoAnimate ? 'waiting' : 'card',
  );
  const [countdown, setCountdown] = useState<number>(0);
  const [pendingStartAt, setPendingStartAt] = useState<number | undefined>(props.startAt);

  // If the race is from a challenge but we landed here without a startAt
  // (e.g. an opponent navigated directly), subscribe to the channel and
  // wait for a race-go event from the other party.
  useEffect(() => {
    if (!props.autoAnimate) return;
    if (!props.challengeId) return;
    if (pendingStartAt) return; // we already have one

    const channel = subscribeToRace(props.challengeId);
    if (!channel) return;

    channel.bind('race-go', (data: { startAt: number }) => {
      setPendingStartAt(data.startAt);
    });

    return () => {
      channel.unbind_all();
      unsubscribeFromRace(props.challengeId!);
    };
  }, [props.autoAnimate, props.challengeId, pendingStartAt]);

  // Drive the countdown → animate transition
  useEffect(() => {
    if (!props.autoAnimate) return;
    if (!pendingStartAt) return;
    if (stage !== 'waiting' && stage !== 'countdown') return;

    const tick = () => {
      const msLeft = pendingStartAt - Date.now();
      if (msLeft <= 0) {
        setStage('animate');
        return;
      }
      setStage('countdown');
      setCountdown(Math.ceil(msLeft / 1000));
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [pendingStartAt, props.autoAnimate, stage]);

  if (stage === 'waiting') {
    return <WaitingScreen />;
  }

  if (stage === 'countdown') {
    return <CountdownScreen value={countdown} />;
  }

  if (stage === 'animate') {
    return (
      <div>
        <RaceAnimation
          challenger={{
            label: props.challengerShortLabel,
            estimatedEt: props.challengerEt ?? 12,
            estimatedTrapSpeed: props.challengerTrap ?? 100,
            drivetrain: props.challengerDrivetrain,
            callsign: props.challengerCallsign ?? undefined,
          }}
          opponent={{
            label: props.opponentShortLabel,
            estimatedEt: props.opponentEt ?? 12,
            estimatedTrapSpeed: props.opponentTrap ?? 100,
            drivetrain: props.opponentDrivetrain,
            callsign: props.opponentCallsign ?? undefined,
          }}
          autoStart
          onFinish={() => setStage('card')}
        />
        <SyncIndicator hasSync={!!props.challengeId && !!props.startAt} />
      </div>
    );
  }

  return (
    <div>
      {(props.challengerIsAdmin || props.opponentIsAdmin) && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          {props.challengerIsAdmin && props.challengerCallsign && (
            <AdminPill callsign={props.challengerCallsign} />
          )}
          {props.opponentIsAdmin && props.opponentCallsign && (
            <AdminPill callsign={props.opponentCallsign} />
          )}
        </div>
      )}

      <RaceResultCard
        challengerLabel={props.challengerLabel}
        challengerCallsign={props.challengerCallsign}
        opponentLabel={props.opponentLabel}
        opponentCallsign={props.opponentCallsign}
        winner={props.winner}
        raceType={props.raceType}
        estimatedGap={props.estimatedGap}
        challengerEt={props.challengerEt}
        opponentEt={props.opponentEt}
        challengerTrap={props.challengerTrap}
        opponentTrap={props.opponentTrap}
        summary={props.summary}
        source={props.source}
      />

      {/* Share section — only when there's a public spectate page */}
      {props.shareSlug && (
        <ShareSection
          slug={props.shareSlug}
          isPublic={props.isPublic}
          isParticipant={props.isParticipant}
          raceResultId={props.raceResultId}
        />
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
        {props.autoAnimate && (
          <button
            onClick={() => {
              setPendingStartAt(Date.now() + 1500);
              setStage('countdown');
            }}
            style={styles.buttonGhost}
          >
            ↻ REPLAY ANIMATION
          </button>
        )}
        <a href="/race" style={{ ...styles.buttonGhost, textDecoration: 'none' }}>
          ← BACK TO RACE
        </a>
        <a href="/race/history" style={{ ...styles.buttonGhost, textDecoration: 'none' }}>
          RACE HISTORY →
        </a>
      </div>

      <div
        style={{
          marginTop: 32,
          textAlign: 'center',
          fontSize: 10,
          color: colors.textDim,
          fontFamily: fonts.mono,
          letterSpacing: '0.2em',
        }}
      >
        RACE RECORDED · {new Date(props.createdAt).toLocaleString()}
      </div>
    </div>
  );
}

function WaitingScreen() {
  return (
    <div style={{ textAlign: 'center', padding: '120px 24px' }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.5em',
          color: colors.accent,
          marginBottom: 16,
          animation: 'ug-pulse 1.4s ease-in-out infinite',
        }}
      >
        WAITING FOR THE OTHER DRIVER
      </div>
      <div style={{ fontSize: 13, color: colors.textMuted }}>Both phones will count down together.</div>
      <style>{`
        @keyframes ug-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function CountdownScreen({ value }: { value: number }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '160px 24px',
        fontFamily: fonts.mono,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.5em',
          color: colors.accent,
          marginBottom: 24,
        }}
      >
        STAGING
      </div>
      <div
        key={value}
        style={{
          fontSize: 200,
          fontWeight: 700,
          color: colors.text,
          textShadow: `0 0 32px ${colors.accent}`,
          animation: 'ug-zoom 1s ease-out',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <style>{`
        @keyframes ug-zoom {
          from { transform: scale(1.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SyncIndicator({ hasSync }: { hasSync: boolean }) {
  if (!hasSync) return null;
  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: 12,
        fontSize: 9,
        letterSpacing: '0.3em',
        color: colors.success,
        fontFamily: fonts.mono,
      }}
    >
      ● LIVE · BOTH SCREENS SYNCED
    </div>
  );
}

function AdminPill({ callsign }: { callsign: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: colors.accentSoft,
        border: `0.5px solid ${colors.accent}`,
        fontFamily: fonts.mono,
      }}
    >
      <span style={{ fontSize: 8, letterSpacing: '0.3em', color: colors.accent, fontWeight: 700 }}>
        ADMIN
      </span>
      <span style={{ fontSize: 11, color: colors.text, fontWeight: 700 }}>@{callsign}</span>
    </div>
  );
}

function ShareSection({
  slug, isPublic, isParticipant, raceResultId,
}: {
  slug: string;
  isPublic: boolean;
  isParticipant: boolean;
  raceResultId: string;
}) {
  const [pubState, setPubState] = useState(isPublic);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = `${APP_URL}/r/${slug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  async function toggleVisibility() {
    setBusy(true);
    const next = !pubState;
    const r = await toggleRacePublic(raceResultId, next);
    setBusy(false);
    if (r.ok) setPubState(next);
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        background: '#0d0d0d',
        border: `0.5px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, fontFamily: fonts.mono, fontWeight: 700 }}>
            {pubState ? '● PUBLIC SPECTATE PAGE' : '● PRIVATE'}
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
            {pubState
              ? 'Anyone with this link can watch the replay'
              : 'Only you and your opponent can see this race'}
          </div>
        </div>
        {isParticipant && (
          <button
            onClick={toggleVisibility}
            disabled={busy}
            style={{
              ...styles.buttonGhost,
              fontSize: 10,
              padding: '8px 14px',
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? '…' : pubState ? 'MAKE PRIVATE' : 'MAKE PUBLIC'}
          </button>
        )}
      </div>

      {pubState && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 0,
              marginBottom: 12,
              border: `0.5px solid ${colors.border}`,
            }}
          >
            <input
              readOnly
              value={url}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                padding: '10px 12px',
                color: colors.text,
                fontFamily: fonts.mono,
                fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              onClick={copyLink}
              style={{
                padding: '10px 16px',
                fontSize: 10,
                letterSpacing: '0.3em',
                fontFamily: fonts.mono,
                fontWeight: 700,
                background: copied ? colors.success : colors.accent,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ShareNetworkLink href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`}>
              X / TWITTER
            </ShareNetworkLink>
            <ShareNetworkLink href={`https://wa.me/?text=${encodeURIComponent(url)}`}>
              WHATSAPP
            </ShareNetworkLink>
            <ShareNetworkLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>
              FACEBOOK
            </ShareNetworkLink>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 14px',
                fontSize: 10,
                letterSpacing: '0.3em',
                fontFamily: fonts.mono,
                fontWeight: 700,
                background: 'transparent',
                color: colors.textMuted,
                border: `0.5px solid ${colors.border}`,
                textDecoration: 'none',
              }}
            >
              PREVIEW PUBLIC PAGE ↗
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function ShareNetworkLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: '8px 14px',
        fontSize: 10,
        letterSpacing: '0.3em',
        fontFamily: fonts.mono,
        fontWeight: 700,
        background: 'transparent',
        color: colors.text,
        border: `0.5px solid ${colors.border}`,
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  );
}
