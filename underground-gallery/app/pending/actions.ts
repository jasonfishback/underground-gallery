'use server';

import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, applications, inviteCodes } from '@/lib/db/schema';
import { customAlphabet } from 'nanoid';

const newId = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz', 10);

const RESERVED = new Set([
  'admin','administrator','root','support','staff','mod','moderator',
  'official','system','undergroundgallery','underground','gallery',
  'me','you','user','users','anonymous','null','undefined',
]);

function normalizeCallsign(input: string): string {
  return input.trim();
}

function callsignError(c: string): string | null {
  if (c.length < 3) return 'Too short (3-20 characters).';
  if (c.length > 20) return 'Too long (3-20 characters).';
  if (!/^[a-zA-Z0-9_]+$/.test(c)) return 'Only letters, numbers, and underscores.';
  if (RESERVED.has(c.toLowerCase())) return 'That callsign is reserved.';
  return null;
}

async function callsignAvailable(c: string): Promise<boolean> {
  const lc = c.toLowerCase();
  const u = await db.select({ id: users.id }).from(users)
    .where(sql`LOWER(${users.callsign}) = ${lc}`).limit(1);
  if (u.length > 0) return false;
  const a = await db.select({ id: applications.id }).from(applications)
    .where(sql`LOWER(${applications.callsign}) = ${lc}`).limit(1);
  return a.length === 0;
}

async function sendEmail(to: string | string[], subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'accessrestricted@undergroundgallery.ai';
  const fromName = process.env.RESEND_FROM_NAME || 'Underground Gallery';
  if (!apiKey) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to, subject, html, text }),
    });
  } catch (e) {
    console.error('Email send failed:', e);
  }
}

export async function checkCallsign(input: string): Promise<{ ok: boolean; error?: string }> {
  const c = normalizeCallsign(input);
  const err = callsignError(c);
  if (err) return { ok: false, error: err };
  const free = await callsignAvailable(c);
  if (!free) return { ok: false, error: 'Already taken.' };
  return { ok: true };
}

export async function submitApplication(callsignInput: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, error: 'Not signed in.' };
  }
  if (session.user.status === 'active') {
    return { ok: false, error: 'Already active.' };
  }

  const c = normalizeCallsign(callsignInput);
  const err = callsignError(c);
  if (err) return { ok: false, error: err };
  const free = await callsignAvailable(c);
  if (!free) return { ok: false, error: 'Already taken.' };

  const userId = session.user.id;
  const userEmail = session.user.email;

  const existingApp = await db.select({ id: applications.id })
    .from(applications).where(eq(applications.userId, userId)).limit(1);
  if (existingApp.length > 0) {
    return { ok: false, error: 'Application already submitted.' };
  }

  const cookieStore = await cookies();
  const inviteCode = cookieStore.get('ug_invite')?.value;
  let inviterId: string | null = null;
  let inviterCallsign: string | null = null;
  let inviterEmail: string | null = null;
  if (inviteCode) {
    const inv = await db.select({ ownerId: inviteCodes.ownerUserId })
      .from(inviteCodes)
      .where(sql`LOWER(${inviteCodes.code}) = LOWER(${inviteCode})`)
      .limit(1);
    if (inv.length > 0) {
      inviterId = inv[0].ownerId;
      const ownerRow = await db.select({ callsign: users.callsign, email: users.email })
        .from(users).where(eq(users.id, inviterId)).limit(1);
      inviterCallsign = ownerRow[0]?.callsign ?? null;
      inviterEmail = ownerRow[0]?.email ?? null;
    }
  }

  const newAppId = newId();
  await db.insert(applications).values({
    id: newAppId,
    userId,
    callsign: c,
    status: 'pending',
    invitedBy: inviterId,
    submittedAt: new Date(),
  } as any);

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  if (adminEmails.length > 0) {
    const inviterTag = inviterCallsign ? `@${inviterCallsign}` : 'an unknown member';
    await sendEmail(
      adminEmails,
      `New application: ${userEmail} (@${c})`,
      `<div style="font-family:system-ui,sans-serif;background:#05060a;color:#f5f6f7;padding:32px;"><div style="font-family:monospace;font-size:11px;letter-spacing:0.4em;color:#ff2a2a;font-weight:700;margin-bottom:12px;">NEW APPLICATION</div><h1 style="font-size:24px;margin:0 0 8px;">@${c}</h1><p style="font-size:13px;color:rgba(201,204,209,0.75);margin:0 0 16px;">${userEmail}</p><p style="font-size:14px;color:rgba(201,204,209,0.75);">Invited by ${inviterTag}</p><a href="https://undergroundgallery.ai/admin/approve" style="display:inline-block;padding:12px 24px;background:#ff2a2a;color:#0a0a0a;text-decoration:none;font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.4em;margin-top:16px;">REVIEW &rarr;</a></div>`,
      `New application from ${userEmail} (@${c}), invited by ${inviterTag}. Review at https://undergroundgallery.ai/admin/approve`
    );
  }

  if (inviterEmail) {
    const approveUrl = `https://undergroundgallery.ai/approve/${newAppId}`;
    const greeting = inviterCallsign ? `@${inviterCallsign}` : 'there';
    await sendEmail(
      inviterEmail,
      `@${c} accepted your invite`,
      `<div style="font-family:system-ui,sans-serif;background:#05060a;color:#f5f6f7;padding:40px 24px;margin:0;"><div style="max-width:480px;margin:0 auto;text-align:center;"><div style="font-family:monospace;font-size:11px;letter-spacing:0.4em;color:#ff2a2a;font-weight:700;margin-bottom:12px;">YOUR INVITE WAS USED</div><h1 style="font-size:28px;margin:0 0 16px;">@${c} is at the door.</h1><p style="font-size:13px;color:rgba(201,204,209,0.65);margin:0 0 8px;">${userEmail}</p><p style="font-size:15px;color:rgba(201,204,209,0.75);line-height:1.6;margin:0 0 32px;">${greeting} -- they used your code. You can vouch for them now and skip the wait.</p><a href="${approveUrl}" style="display:inline-block;padding:14px 32px;background:#ff2a2a;color:#0a0a0a;text-decoration:none;font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.4em;">APPROVE THIS USER</a><p style="font-size:11px;color:rgba(201,204,209,0.5);margin-top:32px;line-height:1.6;">If you did not invite this person or do not want to vouch, ignore this email and an admin will review them.</p></div></div>`,
      `@${c} (${userEmail}) accepted your invite. Approve them at ${approveUrl}`
    );
  }

  return { ok: true };
}