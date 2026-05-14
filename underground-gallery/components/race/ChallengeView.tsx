// components/race/ChallengeView.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptChallenge, declineChallenge, runChallenge } from '@/app/race/actions';
import { subscribeToRace, unsubscribeFromRace } from '@/lib/pusher/client';
import { colors, fonts } from '@/lib/design';

const RACE_LABEL: Record<string, string> = {
  zero_sixty: '0–60 SPRINT',
  quarter_mile: 'QUARTER MILE',
  half_mile: 'HALF MILE',
  roll_40_140: '40–140 ROLL',
  highway_pull: 'HIGHWAY PULL',
  dig: 'DIG RACE',
  overall: 'OVERALL',
};

type Participant = {
  callsign: string | null;
  isModerator: boolean;
  vehicleLabel: string;
  vehicleHp: number | null;
  vehicleTorque: number | null;
  vehicleWeight: number | null;
  vehicleDrivetrain: string | null;
};

type Props = {
  challengeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'raced' | 'expired';
  raceType: string;
  message: string | null;
  expiresAt: Date;
  createdAt: Date;
  challenger: Participant;
  opponent: Participant;
  isMyChallenge: boolean;
  isOpponent: boolean;
  justSent: boolean;
};

export function ChallengeView({
  challengeId,
  status,
  raceType,
  message,
  expiresAt,
  challenger,
  opponent,
  isMyChallenge,
  isOpponent,
  justSent,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time sync: subscribe to the race channel as soon as we're on this
  // page. We listen for two events:
  //   - challenge-accepted: refresh server props so the challenger's UI
  //     updates from "waiting…" to "▶ START THE RACE" without a manual
  //     reload.
  //   - race-go: either party clicked start. Both clients navigate to the
  //     result page with the shared startAt timestamp in the URL so the
  //     animation triggers at the same instant on both screens.
  useEffect(() => {
    const channel = subscribeToRace(challengeId);
    if (!channel) return;

    channel.bind('challenge-accepted', () => {
      router.refresh();
    });

    channel.bind('race-go', (data: { raceResultId: string; startAt: number }) => {
      router.push(`/race/result/${data.raceResultId}?animate=1&startAt=${data.startAt}`);
    });

    return () => {
      channel.unbind_all();
      unsubscribeFromRace(challengeId);
    };
  }, [challengeId, router]);

  async function handleAccept() {
    setSubmitting(true);
    setError(null);
    const r = await acceptChallenge(challengeId);
    setSubmitting(false);
    if (!r.ok) setError(r.error);
    else router.refresh();
  }

  async function handleDecline() {
    if (!confirm('Decline this challenge?')) return;
    setSubmitting(true);
    setError(null);
    const r = await declineChallenge(challengeId);
    setSubmitting(false);
    if (!r.ok) setError(r.error);
    else router.push('/race');
  }

  async function handleStartRace() {
    setSubmitting(true);
    setError(null);
    const r = await runChallenge(challengeId);
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    const data = (r as any).data;
    // The action also publishes a Pusher 'race-go' event with the same
    // startAt for the opponent. We use the URL's startAt to sync the
    // animation timing to that shared moment.
    const startAt = data.startAt ?? Date.now() + 3000;
    router.push(`/race/result/${data.raceResultId}?animate=1&startAt=${startAt}`);
  }

  return (
    <div>
      {justSent && (
        <div className="ug-banner ug-banner-success" style={{ marginBottom: 24 }}>
          ✓ Challenge sent. {opponent.callsign ? `@${opponent.callsign}` : 'They'} will be notified by email and in-app.
        </div>
      )}

      <div className="ug-mono" style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, marginBottom: 8 }}>
        ∕∕ CHALLENGE · {RACE_LABEL[raceType] ?? raceType.toUpperCase()}
      </div>
      <h1 style={{ fontSize: 28, margin: '0 0 24px', letterSpacing: '0.05em' }}>
        {status === 'pending' && (isOpponent ? 'You\'ve been challenged.' : 'Awaiting response…')}
        {status === 'accepted' && 'Challenge accepted. Time to race.'}
        {status === 'declined' && 'Challenge declined.'}
        {status === 'expired' && 'This challenge has expired.'}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'stretch', marginBottom: 32 }}>
        <ParticipantCard p={challenger} role="CHALLENGER" />
        <div
          className="ug-mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            color: colors.accent,
            fontWeight: 700,
            letterSpacing: '0.1em',
          }}
        >
          VS
        </div>
        <ParticipantCard p={opponent} role="OPPONENT" />
      </div>

      {message && (
        <div className="ug-card" style={{ padding: 20, marginBottom: 24 }}>
          <div className="ug-label">MESSAGE</div>
          <div style={{ fontSize: 14, fontStyle: 'italic', color: colors.text }}>"{message}"</div>
        </div>
      )}

      {error && (
        <div className="ug-banner ug-banner-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {status === 'pending' && isOpponent && (
          <>
            <button onClick={handleDecline} disabled={submitting} className="ug-btn ug-btn-ghost">
              DECLINE
            </button>
            <button onClick={handleAccept} disabled={submitting} className="ug-btn ug-btn-primary">
              {submitting ? 'WORKING…' : 'ACCEPT CHALLENGE'}
            </button>
          </>
        )}
        {status === 'pending' && isMyChallenge && (
          <div style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>
            Waiting for {opponent.callsign ? `@${opponent.callsign}` : 'them'} to respond. Expires{' '}
            {new Date(expiresAt).toLocaleDateString()}.
          </div>
        )}
        {status === 'accepted' && (
          <button
            onClick={handleStartRace}
            disabled={submitting}
            className="ug-btn ug-btn-primary"
            style={{
              padding: '20px 40px',
              fontSize: 16,
              letterSpacing: '0.4em',
            }}
          >
            {submitting ? 'BURNING OUT…' : '▶ START THE RACE'}
          </button>
        )}
        {status === 'declined' && (
          <a href="/race" className="ug-btn ug-btn-ghost" style={{ textDecoration: 'none' }}>
            ← BACK TO RACE
          </a>
        )}
      </div>
    </div>
  );
}

function ParticipantCard({ p, role }: { p: Participant; role: string }) {
  return (
    <div className="ug-card" style={{ padding: 20 }}>
      <div className="ug-label">{role}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: colors.accent, letterSpacing: '0.03em' }}>
          @{p.callsign ?? '???'}
        </div>
        {p.isModerator && (
          <span
            className="ug-mono"
            style={{
              fontSize: 8,
              letterSpacing: '0.2em',
              color: colors.accent,
              border: `1px solid ${colors.accentBorder}`,
              padding: '2px 6px',
              fontWeight: 700,
            }}
          >
            ADMIN
          </span>
        )}
      </div>
      <div style={{ fontSize: 14, color: colors.text, marginBottom: 12 }}>{p.vehicleLabel}</div>
      <div className="ug-mono" style={{ display: 'flex', gap: 16, fontSize: 11, color: colors.textMuted }}>
        {p.vehicleHp != null && <span>{p.vehicleHp}hp</span>}{p.vehicleTorque != null && <span>{p.vehicleTorque}tq</span>}
        {p.vehicleWeight != null && <span>{p.vehicleWeight.toLocaleString()}lb</span>}
        {p.vehicleDrivetrain && <span>{p.vehicleDrivetrain}</span>}
      </div>
    </div>
  );
}
