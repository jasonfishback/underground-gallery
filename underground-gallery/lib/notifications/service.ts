// lib/notifications/service.ts
//
// Creates notification rows and (best-effort) sends email via Resend.
// Email is fire-and-forget: a failed email never blocks the in-app row.

import { customAlphabet } from 'nanoid';
import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const newId = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz', 12);

type NotificationKind =
  | 'challenge_received'
  | 'challenge_accepted'
  | 'challenge_declined'
  | 'race_completed'
  | 'race_practice_run'
  | 'photo_flagged'
  | 'application_decision'
  | 'system';

export type NotifyInput = {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  /** Whether to send an email. Default: true for everything except 'system'. */
  sendEmail?: boolean;
  /** Email subject. Defaults to title. */
  emailSubject?: string;
  /** Email HTML body. If omitted, a generic template is used. */
  emailHtml?: string;
};

export async function notify(input: NotifyInput): Promise<{ id: string }> {
  const id = newId();
  await db.insert(notifications).values({
    id,
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    metadata: input.metadata ?? null,
  });

  const shouldEmail = input.sendEmail ?? input.kind !== 'system';
  if (shouldEmail) {
    // Fire-and-forget — don't await
    sendEmail(id, input).catch((err) => {
      console.error('[notify] email failed', err);
    });
  }

  return { id };
}

async function sendEmail(notificationId: string, input: NotifyInput): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? 'Underground Gallery <noreply@undergroundgallery.ai>';
  if (!resendKey) {
    console.warn('[notify] RESEND_API_KEY not set, skipping email');
    return;
  }

  const [user] = await db
    .select({ email: users.email, callsign: users.callsign })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!user?.email) return;

  const subject = input.emailSubject ?? input.title;
  const html = input.emailHtml ?? buildGenericHtml(input);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [user.email],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error('[notify] resend error', res.status, txt);
    return;
  }

  await db
    .update(notifications)
    .set({ emailSentAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

function buildGenericHtml(input: NotifyInput): string {
  const link = input.link
    ? `<p style="margin-top: 24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://undergroundgallery.ai'}${input.link}" style="display: inline-block; padding: 12px 20px; background: #ff3030; color: #fff; text-decoration: none; letter-spacing: 0.1em;">VIEW</a></p>`
    : '';
  return `
    <div style="font-family: system-ui, sans-serif; background: #0a0a0a; color: #fafafa; padding: 32px; max-width: 560px; margin: 0 auto;">
      <div style="font-size: 11px; letter-spacing: 0.4em; color: #ff3030; margin-bottom: 8px;">UNDERGROUND GALLERY</div>
      <h1 style="font-size: 22px; margin: 0 0 16px;">${escapeHtml(input.title)}</h1>
      ${input.body ? `<p style="color: #aaa; line-height: 1.6; font-size: 14px;">${escapeHtml(input.body)}</p>` : ''}
      ${link}
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));
}

// ── Specific helpers ──────────────────────────────────────────────────────

export async function notifyChallengeReceived(opts: {
  opponentUserId: string;
  challengerCallsign: string;
  challengerVehicleLabel: string;
  opponentVehicleLabel: string;
  raceType: string;
  challengeId: string;
}) {
  const raceLabel = RACE_LABELS[opts.raceType] ?? opts.raceType;
  return notify({
    userId: opts.opponentUserId,
    kind: 'challenge_received',
    title: `${opts.challengerCallsign} challenged you`,
    body: `${opts.challengerCallsign} (${opts.challengerVehicleLabel}) wants to race your ${opts.opponentVehicleLabel} in a ${raceLabel}.`,
    link: `/race/challenge/${opts.challengeId}`,
  });
}

export async function notifyChallengeAccepted(opts: {
  challengerUserId: string;
  opponentCallsign: string;
  challengeId: string;
}) {
  return notify({
    userId: opts.challengerUserId,
    kind: 'challenge_accepted',
    title: `${opts.opponentCallsign} accepted your challenge`,
    body: `Time to settle it. Either party can hit "start race" to watch live.`,
    link: `/race/challenge/${opts.challengeId}`,
  });
}

export async function notifyChallengeDeclined(opts: {
  challengerUserId: string;
  opponentCallsign: string;
}) {
  return notify({
    userId: opts.challengerUserId,
    kind: 'challenge_declined',
    title: `${opts.opponentCallsign} declined your challenge`,
  });
}

export async function notifyRaceCompleted(opts: {
  userId: string;
  won: boolean;
  myCallsign: string;
  opponentCallsign: string;
  raceType: string;
  raceResultId: string;
  gapSeconds: number;
}) {
  const raceLabel = RACE_LABELS[opts.raceType] ?? opts.raceType;
  const verdict = opts.won
    ? `You beat ${opts.opponentCallsign}`
    : `${opts.opponentCallsign} beat you`;
  return notify({
    userId: opts.userId,
    kind: 'race_completed',
    title: `${verdict} in the ${raceLabel}`,
    body: `Gap: ${opts.gapSeconds.toFixed(2)}s. Tap to see the replay.`,
    link: `/race/result/${opts.raceResultId}`,
  });
}

const RACE_LABELS: Record<string, string> = {
  zero_sixty: '0–60',
  quarter_mile: 'quarter-mile',
  half_mile: 'half-mile',
  roll_40_140: '40–140 roll',
  highway_pull: 'highway pull',
  dig: 'dig race',
  overall: 'overall comparison',
};
