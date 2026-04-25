import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';

// POST /api/apply
// Body: { email: string, name?: string, callsign?: string, region?: string,
//         drive?: string, instagram?: string, invitedBy?: string, message?: string }
//
// Stores the application in Vercel KV and sends a confirmation email via Resend.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'accessrestricted@undergroundgallery.ai';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Underground Gallery';

interface Application {
  id: string;
  email: string;
  name?: string;
  callsign?: string;
  region?: string;
  drive?: string;
  instagram?: string;
  invitedBy?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  ip?: string;
  userAgent?: string;
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function id(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').toString().trim().toLowerCase();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await kv.get(`applicant:${email}`);
    if (existing) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        message: 'You are already on the list. We will be in touch.',
      });
    }

    const application: Application = {
      id: id(),
      email,
      name: body.name?.toString().slice(0, 120),
      callsign: body.callsign?.toString().slice(0, 60),
      region: body.region?.toString().slice(0, 60),
      drive: body.drive?.toString().slice(0, 200),
      instagram: body.instagram?.toString().slice(0, 60),
      invitedBy: body.invitedBy?.toString().slice(0, 60),
      message: body.message?.toString().slice(0, 1000),
      status: 'pending',
      createdAt: Date.now(),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0],
      userAgent: req.headers.get('user-agent') || undefined,
    };

    // Store in KV
    await Promise.all([
      kv.set(`applicant:${email}`, application),
      kv.lpush('applicants:list', application.id),
      kv.set(`applicant:by-id:${application.id}`, email),
      kv.incr('applicants:count'),
    ]);

    // Send confirmation email (best-effort — don't fail the request if email is down)
    if (RESEND_API_KEY) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: email,
          subject: 'Application received · Underground Gallery',
          html: confirmationEmailHTML(application),
          text: confirmationEmailText(application),
        });
      } catch (err) {
        console.error('Resend send failed', err);
        // continue — application is saved, email retry is a manual op
      }
    }

    // Optional: webhook ping for new applications
    const webhook = process.env.NEW_APPLICATION_WEBHOOK_URL;
    if (webhook) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `New UG application: ${email}` + (application.callsign ? ` (${application.callsign})` : ''),
          }),
        });
      } catch (err) {
        console.error('Webhook failed', err);
      }
    }

    return NextResponse.json({ ok: true, id: application.id });
  } catch (err) {
    console.error('apply error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ─── Email templates ──────────────────────────────────────────────────────

function confirmationEmailHTML(a: Application): string {
  const name = a.callsign || a.name || 'Applicant';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Application received</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#f5f6f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0f0f0f;border:1px solid #1a1a1a;">
          <tr>
            <td style="padding:48px 40px 24px;border-bottom:1px solid #1a1a1a;">
              <div style="font-family:'Courier New',monospace;font-size:11px;color:#ff2a2a;letter-spacing:0.3em;font-weight:bold;margin-bottom:16px;">∕∕ UNDERGROUND GALLERY</div>
              <h1 style="font-size:28px;font-weight:bold;color:#f5f6f7;margin:0 0 8px;letter-spacing:-0.02em;">Application received.</h1>
              <p style="font-size:14px;color:#9a9da3;margin:0;line-height:1.6;">${name}, your application is in. We review every one by hand.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="font-size:14px;color:#c9ccd1;margin:0 0 20px;line-height:1.7;">
                Underground Gallery is invite-only. We open four times a year. When the next door opens, you will hear from this address — not before.
              </p>
              <p style="font-size:14px;color:#c9ccd1;margin:0 0 20px;line-height:1.7;">
                Please don't reply asking about your status. Anyone who pings will be deprioritized. The only way in is to wait.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #1a1a1a;width:100%;">
                <tr><td style="padding:14px 16px;font-family:'Courier New',monospace;font-size:11px;color:#9a9da3;letter-spacing:0.18em;border-bottom:1px solid #1a1a1a;">APPLICATION</td><td style="padding:14px 16px;font-family:'Courier New',monospace;font-size:11px;color:#f5f6f7;letter-spacing:0.18em;text-align:right;border-bottom:1px solid #1a1a1a;">${a.id.toUpperCase()}</td></tr>
                <tr><td style="padding:14px 16px;font-family:'Courier New',monospace;font-size:11px;color:#9a9da3;letter-spacing:0.18em;border-bottom:1px solid #1a1a1a;">STATUS</td><td style="padding:14px 16px;font-family:'Courier New',monospace;font-size:11px;color:#ff2a2a;letter-spacing:0.18em;text-align:right;border-bottom:1px solid #1a1a1a;">PENDING REVIEW</td></tr>
                <tr><td style="padding:14px 16px;font-family:'Courier New',monospace;font-size:11px;color:#9a9da3;letter-spacing:0.18em;">EMAIL</td><td style="padding:14px 16px;font-family:'Courier New',monospace;font-size:11px;color:#f5f6f7;letter-spacing:0.06em;text-align:right;">${a.email}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 40px;border-top:1px solid #1a1a1a;">
              <p style="font-family:'Courier New',monospace;font-size:10px;color:#5a5d63;letter-spacing:0.3em;margin:0;">∕∕ EST. MMXXVI · INVITE ONLY</p>
              <p style="font-family:'Courier New',monospace;font-size:10px;color:#5a5d63;letter-spacing:0.06em;margin:8px 0 0;">undergroundgallery.ai · @undergroundgalleryai</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function confirmationEmailText(a: Application): string {
  const name = a.callsign || a.name || 'Applicant';
  return `// UNDERGROUND GALLERY

${name}, your application is in.

We review every one by hand. Underground Gallery is invite-only. We open four
times a year. When the next door opens, you will hear from this address — not
before.

Please don't reply asking about your status. Anyone who pings will be
deprioritized. The only way in is to wait.

  APPLICATION  ${a.id.toUpperCase()}
  STATUS       PENDING REVIEW
  EMAIL        ${a.email}

— Underground Gallery
undergroundgallery.ai · @undergroundgalleryai
`;
}
