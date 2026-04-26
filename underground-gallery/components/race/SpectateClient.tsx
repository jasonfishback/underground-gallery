// components/race/SpectateClient.tsx
'use client';

import { useState } from 'react';
import { RaceAnimation } from './RaceAnimation';
import { styles, colors, fonts } from '@/lib/design';

const APP_URL =
  (typeof window !== 'undefined' ? window.location.origin : null) ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://undergroundgallery.ai';

const RACE_LABEL: Record<string, string> = {
  zero_sixty: '0–60',
  quarter_mile: 'Quarter Mile',
  half_mile: 'Half Mile',
  roll_40_140: '40–140 Roll',
  highway_pull: 'Highway Pull',
  dig: 'Dig Race',
  overall: 'Overall',
};

type Props = {
  challengerLabel: string;
  challengerShortLabel: string;
  challengerCallsign: string | null;
  challengerIsAdmin: boolean;
  challengerDrivetrain: string;
  challengerPhotoUrl: string | null;
  opponentLabel: string;
  opponentShortLabel: string;
  opponentCallsign: string | null;
  opponentIsAdmin: boolean;
  opponentDrivetrain: string;
  opponentPhotoUrl: string | null;
  winner: 'challenger' | 'opponent' | 'tie';
  raceType: string;
  estimatedGap: number;
  challengerEt: number | null;
  opponentEt: number | null;
  challengerTrap: number | null;
  opponentTrap: number | null;
  summary: string;
  slug: string;
  createdAt: Date;
};

export function SpectateClient(props: Props) {
  const [stage, setStage] = useState<'preroll' | 'animate' | 'result'>('preroll');

  if (stage === 'preroll') {
    return <PreRoll {...props} onPlay={() => setStage('animate')} />;
  }

  if (stage === 'animate') {
    return (
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
        onFinish={() => setStage('result')}
      />
    );
  }

  return <Result {...props} onReplay={() => setStage('animate')} />;
}

// ── Pre-roll: a play button overlay on top of car photos ────────────────

function PreRoll(props: Props & { onPlay: () => void }) {
  const winnerCallsign =
    props.winner === 'challenger'
      ? props.challengerCallsign
      : props.winner === 'opponent'
        ? props.opponentCallsign
        : null;

  return (
    <div>
      {/* Hero: both cars stacked with a play button between */}
      <div
        style={{
          position: 'relative',
          minHeight: 360,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          background: colors.border,
          marginBottom: 16,
        }}
      >
        <SideHero
          photoUrl={props.challengerPhotoUrl}
          callsign={props.challengerCallsign}
          isAdmin={props.challengerIsAdmin}
          label={props.challengerLabel}
          isWinner={props.winner === 'challenger'}
          isTie={props.winner === 'tie'}
          alignRight
        />
        <SideHero
          photoUrl={props.opponentPhotoUrl}
          callsign={props.opponentCallsign}
          isAdmin={props.opponentIsAdmin}
          label={props.opponentLabel}
          isWinner={props.winner === 'opponent'}
          isTie={props.winner === 'tie'}
        />

        {/* Center play button */}
        <button
          onClick={props.onPlay}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: colors.accent,
            border: `4px solid ${colors.bg}`,
            cursor: 'pointer',
            color: '#fff',
            fontSize: 32,
            fontWeight: 700,
            paddingLeft: 6, // optical center for the play triangle
            boxShadow: '0 0 48px rgba(255,48,48,0.6)',
          }}
          aria-label="Play race"
        >
          ▶
        </button>

        {/* "VS" between the two halves on small screens */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 14,
            color: colors.text,
            fontWeight: 700,
            fontFamily: fonts.mono,
            letterSpacing: '0.2em',
            background: colors.bg,
            padding: '4px 10px',
            border: `0.5px solid ${colors.border}`,
          }}
        >
          VS
        </div>
      </div>

      {/* Below-hero: tap-to-play prompt + share */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <button
          onClick={props.onPlay}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            fontSize: 12,
            letterSpacing: '0.3em',
            fontFamily: fonts.mono,
          }}
        >
          ▶ TAP TO WATCH THE REPLAY
        </button>
      </div>

      {/* Result preview (small) — tells the viewer this is real already */}
      <div
        style={{
          ...styles.panel,
          padding: 20,
          marginBottom: 24,
          textAlign: 'center',
          background: '#0d0d0d',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.textMuted, marginBottom: 8 }}>
          FINAL RESULT
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          {winnerCallsign ? (
            <>
              <span style={{ color: colors.accent }}>@{winnerCallsign}</span>{' '}
              <span style={{ color: colors.textMuted, fontSize: 14, letterSpacing: '0.1em' }}>
                BY {props.estimatedGap < 0.2 ? 'A FENDER' : `${props.estimatedGap.toFixed(2)}s`}
              </span>
            </>
          ) : (
            <span style={{ color: colors.textMuted }}>DEAD HEAT</span>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 16, fontFamily: fonts.mono }}>
          {props.challengerEt !== null && (
            <Stat label="@?" callsign={props.challengerCallsign} et={props.challengerEt} trap={props.challengerTrap} />
          )}
          {props.opponentEt !== null && (
            <Stat label="@?" callsign={props.opponentCallsign} et={props.opponentEt} trap={props.opponentTrap} />
          )}
        </div>
      </div>

      <ShareBar slug={props.slug} winner={winnerCallsign} />
    </div>
  );
}

function SideHero({
  photoUrl,
  callsign,
  isAdmin,
  label,
  isWinner,
  isTie,
  alignRight,
}: {
  photoUrl: string | null;
  callsign: string | null;
  isAdmin: boolean;
  label: string;
  isWinner: boolean;
  isTie: boolean;
  alignRight?: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: 360,
        background: photoUrl
          ? `linear-gradient(${alignRight ? '270deg' : '90deg'}, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 100%), url(${photoUrl}) center/cover`
          : '#0d0d0d',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: alignRight ? 'flex-end' : 'flex-start',
        textAlign: alignRight ? 'right' : 'left',
      }}
    >
      {/* Winner badge */}
      {isWinner && !isTie && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: alignRight ? undefined : 20,
            right: alignRight ? 20 : undefined,
            fontSize: 10,
            letterSpacing: '0.4em',
            color: '#fff',
            background: colors.accent,
            padding: '4px 10px',
            fontFamily: fonts.mono,
            fontWeight: 700,
          }}
        >
          ✓ WINNER
        </div>
      )}
      {/* Callsign */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.accent, fontFamily: fonts.mono, letterSpacing: '0.03em' }}>
          @{callsign ?? '???'}
        </div>
        {isAdmin && (
          <span
            style={{
              fontSize: 8,
              letterSpacing: '0.25em',
              color: colors.accent,
              border: `0.5px solid ${colors.accent}`,
              padding: '2px 6px',
              fontFamily: fonts.mono,
              fontWeight: 700,
              background: colors.accentSoft,
            }}
          >
            ADMIN
          </span>
        )}
      </div>
      <div style={{ fontSize: 14, color: colors.text, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function Stat({ callsign, et, trap }: { label: string; callsign: string | null; et: number | null; trap: number | null }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, letterSpacing: '0.3em', color: colors.textDim, marginBottom: 4 }}>
        @{callsign ?? '???'}
      </div>
      {et !== null && (
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: fonts.mono }}>
          {et.toFixed(2)}
          <span style={{ fontSize: 10, color: colors.textMuted }}>s</span>
        </div>
      )}
      {trap !== null && (
        <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: fonts.mono }}>
          {trap.toFixed(0)}mph
        </div>
      )}
    </div>
  );
}

// ── Result screen (after animation) ─────────────────────────────────────

function Result(props: Props & { onReplay: () => void }) {
  const winnerCallsign =
    props.winner === 'challenger'
      ? props.challengerCallsign
      : props.winner === 'opponent'
        ? props.opponentCallsign
        : null;

  return (
    <div>
      <div
        style={{
          background: winnerCallsign ? colors.accentSoft : '#222',
          border: `1px solid ${winnerCallsign ? colors.accent : colors.border}`,
          padding: '28px 24px',
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.5em', color: colors.accent, marginBottom: 12 }}>
          {RACE_LABEL[props.raceType]?.toUpperCase()}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '0.05em' }}>
          {winnerCallsign ? (
            <>
              <span style={{ color: colors.accent }}>@{winnerCallsign}</span> WINS
            </>
          ) : (
            'DEAD HEAT'
          )}
        </div>
        {winnerCallsign && (
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 8, fontFamily: fonts.mono, letterSpacing: '0.2em' }}>
            BY {props.estimatedGap < 0.2 ? 'A FENDER' : `${props.estimatedGap.toFixed(2)} SECONDS`}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <SidePhotoCard
          photoUrl={props.challengerPhotoUrl}
          callsign={props.challengerCallsign}
          isAdmin={props.challengerIsAdmin}
          label={props.challengerLabel}
          et={props.challengerEt}
          trap={props.challengerTrap}
          isWinner={props.winner === 'challenger'}
        />
        <SidePhotoCard
          photoUrl={props.opponentPhotoUrl}
          callsign={props.opponentCallsign}
          isAdmin={props.opponentIsAdmin}
          label={props.opponentLabel}
          et={props.opponentEt}
          trap={props.opponentTrap}
          isWinner={props.winner === 'opponent'}
        />
      </div>

      {props.summary && (
        <div style={{ ...styles.panel, marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.textMuted, marginBottom: 8 }}>
            SUMMARY
          </div>
          <div style={{ fontSize: 14, color: colors.text, lineHeight: 1.7 }}>{props.summary}</div>
        </div>
      )}

      <ShareBar slug={props.slug} winner={winnerCallsign} />

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={props.onReplay} style={styles.buttonGhost}>
          ↻ WATCH AGAIN
        </button>
      </div>
    </div>
  );
}

function SidePhotoCard({
  photoUrl, callsign, isAdmin, label, et, trap, isWinner,
}: {
  photoUrl: string | null; callsign: string | null; isAdmin: boolean;
  label: string; et: number | null; trap: number | null; isWinner: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: 200,
        background: photoUrl
          ? `linear-gradient(180deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.95) 100%), url(${photoUrl}) center/cover`
          : '#111',
        border: `0.5px solid ${isWinner ? colors.accent : colors.border}`,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.3em', color: colors.accent, fontFamily: fonts.mono, fontWeight: 700 }}>
          @{callsign ?? '???'}
        </span>
        {isAdmin && (
          <span style={{ fontSize: 7, letterSpacing: '0.2em', color: colors.accent, border: `0.5px solid ${colors.accent}`, padding: '1px 4px', fontFamily: fonts.mono }}>
            ADMIN
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {et !== null && (
          <div>
            <div style={{ fontSize: 8, letterSpacing: '0.3em', color: colors.textDim }}>ET</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: fonts.mono }}>
              {et.toFixed(2)}
              <span style={{ fontSize: 9, color: colors.textMuted }}>s</span>
            </div>
          </div>
        )}
        {trap !== null && (
          <div>
            <div style={{ fontSize: 8, letterSpacing: '0.3em', color: colors.textDim }}>TRAP</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: fonts.mono }}>
              {trap.toFixed(0)}
              <span style={{ fontSize: 9, color: colors.textMuted }}>mph</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Share bar ────────────────────────────────────────────────────────────

function ShareBar({ slug, winner }: { slug: string; winner: string | null }) {
  const [copied, setCopied] = useState(false);
  const url = `${APP_URL}/r/${slug}`;
  const shareText = winner
    ? `@${winner} just took it on Underground Gallery — watch the replay`
    : 'Photo finish on Underground Gallery — watch the replay';

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
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

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: 'Underground Gallery race', text: shareText, url });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  }

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div
      style={{
        background: '#0d0d0d',
        border: `0.5px solid ${colors.border}`,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.textMuted, marginBottom: 12, fontFamily: fonts.mono }}>
        SHARE THIS RACE
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <ShareButton onClick={nativeShare} primary>
          {copied ? '✓ COPIED' : '↗ SHARE'}
        </ShareButton>
        <ShareButton onClick={copyLink}>{copied ? '✓ COPIED' : '⌘ COPY LINK'}</ShareButton>
        <ShareLink href={xUrl}>X / TWITTER</ShareLink>
        <ShareLink href={waUrl}>WHATSAPP</ShareLink>
        <ShareLink href={fbUrl}>FACEBOOK</ShareLink>
      </div>
      <div
        style={{
          fontSize: 10,
          color: colors.textDim,
          marginTop: 12,
          fontFamily: fonts.mono,
          wordBreak: 'break-all',
          letterSpacing: '0.05em',
        }}
      >
        {url}
      </div>
    </div>
  );
}

function ShareButton({
  onClick, children, primary,
}: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        fontSize: 11,
        letterSpacing: '0.3em',
        fontFamily: fonts.mono,
        fontWeight: 700,
        background: primary ? colors.accent : 'transparent',
        color: primary ? '#fff' : colors.text,
        border: `0.5px solid ${primary ? colors.accent : colors.border}`,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function ShareLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: '10px 16px',
        fontSize: 11,
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
