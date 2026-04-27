import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, applications } from '@/lib/db/schema';
import { customAlphabet } from 'nanoid';
import { colors, fonts } from '@/lib/design';

const newId = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz', 10);

export const dynamic = 'force-dynamic';

async function sendApprovalEmail(toEmail: string, callsign: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'accessrestricted@undergroundgallery.ai';
  const fromName = process.env.RESEND_FROM_NAME || 'Underground Gallery';
  if (!apiKey) return;
  const name = callsign || toEmail.split('@')[0];
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: toEmail,
        subject: `You're in. // ACCESS GRANTED`,
        html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#05060a;color:#f5f6f7;padding:40px 24px;margin:0;">
<div style="max-width:480px;margin:0 auto;text-align:center;">
<div style="font-family:monospace;font-size:11px;letter-spacing:0.4em;color:#ff2a2a;font-weight:700;margin-bottom:16px;">ACCESS GRANTED</div>
<h1 style="font-size:36px;font-weight:800;margin:0 0 16px;">You're in, ${name}.</h1>
<p style="font-size:15px;color:rgba(201,204,209,0.75);line-height:1.65;margin:0 0 32px;">Welcome to Underground Gallery. The room is yours. Park your car, log a race, invite a friend.</p>
<a href="https://undergroundgallery.ai/me" style="display:inline-block;padding:14px 32px;background:#ff2a2a;color:#0a0a0a;text-decoration:none;font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.4em;">ENTER THE GARAGE</a>
<p style="font-size:11px;color:rgba(201,204,209,0.5);margin-top:48px;font-family:monospace;letter-spacing:0.2em;">UNDERGROUND GALLERY</p>
</div></body></html>`,
        text: `You're in, ${name}. Welcome to Underground Gallery. Visit https://undergroundgallery.ai/me to enter.`,
      }),
    });
  } catch (e) {
    console.error('Approval email failed:', e);
  }
}

async function approveUser(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.id) return;
  const [me] = await db.select({ isModerator: users.isModerator }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!me?.isModerator) return;

  const userId = String(formData.get('userId') || '').trim();
  const customCallsign = String(formData.get('callsign') || '').trim();
  if (!userId) return;

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target || !target.email) return;

  const finalCallsign = customCallsign || target.callsign || target.email.split('@')[0];

  const existingApp = await db.select().from(applications).where(eq(applications.userId, target.id)).limit(1);
  if (existingApp.length === 0) {
    await db.insert(applications).values({
      id: newId(),
      userId: target.id,
      callsign: finalCallsign,
      status: 'approved',
      submittedAt: new Date(),
      decidedAt: new Date(),
      decidedBy: session.user.id,
    } as any);
  } else {
    await db.update(applications).set({
      status: 'approved',
      callsign: finalCallsign,
      decidedAt: new Date(),
      decidedBy: session.user.id,
    }).where(eq(applications.userId, target.id));
  }

  await db.update(users).set({ status: 'active', callsign: finalCallsign, approvedAt: new Date() }).where(eq(users.id, target.id));
  await sendApprovalEmail(target.email, finalCallsign);
  redirect('/admin/approve?ok=' + encodeURIComponent(target.email));
}

async function setCallsignOnly(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.id) return;
  const [me] = await db.select({ isModerator: users.isModerator }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!me?.isModerator) return;

  const userId = String(formData.get('userId') || '').trim();
  const callsign = String(formData.get('callsign') || '').trim();
  if (!userId || !callsign) return;

  await db.update(users).set({ callsign }).where(eq(users.id, userId));
  await db.update(applications).set({ callsign }).where(eq(applications.userId, userId));
  redirect('/admin/approve?cs=' + encodeURIComponent(callsign));
}

export default async function QuickApprovePage({ searchParams }: { searchParams: Promise<{ ok?: string; cs?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  const [me] = await db.select({ isModerator: users.isModerator }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!me?.isModerator) redirect('/');

  const sp = await searchParams;
  const ok = sp?.ok;
  const cs = sp?.cs;

  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    callsign: users.callsign,
    status: users.status,
    createdAt: users.createdAt,
  }).from(users).orderBy(sql`${users.createdAt} DESC`).limit(30);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: fonts.sans, color: colors.text, background: colors.bg, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, fontFamily: fonts.mono, marginBottom: 24 }}>
        QUICK APPROVE
      </h1>

      {ok && (
        <div style={{ padding: 16, background: 'rgba(120,220,150,0.1)', border: '0.5px solid rgb(120,220,150)', color: 'rgb(120,220,150)', marginBottom: 24, fontFamily: fonts.mono, fontSize: 12 }}>
          APPROVED + EMAIL SENT: {ok}
        </div>
      )}
      {cs && (
        <div style={{ padding: 16, background: 'rgba(120,220,150,0.1)', border: '0.5px solid rgb(120,220,150)', color: 'rgb(120,220,150)', marginBottom: 24, fontFamily: fonts.mono, fontSize: 12 }}>
          CALLSIGN SET: {cs}
        </div>
      )}

      <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: fonts.mono, letterSpacing: '0.2em', marginBottom: 12 }}>
        USERS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {allUsers.map((u) => (
          <div key={u.id} style={{ padding: 14, border: `0.5px solid ${colors.border}`, background: colors.bgElevated, fontFamily: fonts.mono, fontSize: 12 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{u.email}</div>
              <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
                {u.callsign ? `@${u.callsign}` : 'no callsign'} · <span style={{ color: u.status === 'active' ? 'rgb(120,220,150)' : colors.accent }}>{u.status?.toUpperCase()}</span>
              </div>
            </div>

            {u.status === 'active' ? (
              <form action={setCallsignOnly} style={{ display: 'flex', gap: 8 }}>
                <input type="hidden" name="userId" value={u.id} />
                <input
                  name="callsign"
                  defaultValue={u.callsign ?? ''}
                  placeholder="callsign"
                  autoCapitalize="characters"
                  style={{ flex: 1, padding: 10, background: colors.bg, border: `0.5px solid ${colors.border}`, color: colors.text, fontSize: 13, fontFamily: fonts.mono, textTransform: 'uppercase' }}
                />
                <button type="submit" style={{ padding: '8px 14px', background: 'transparent', color: colors.text, border: `0.5px solid ${colors.border}`, fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', cursor: 'pointer' }}>
                  SAVE
                </button>
              </form>
            ) : (
              <form action={approveUser} style={{ display: 'flex', gap: 8 }}>
                <input type="hidden" name="userId" value={u.id} />
                <input
                  name="callsign"
                  defaultValue={u.callsign ?? u.email.split('@')[0]}
                  placeholder="callsign"
                  autoCapitalize="characters"
                  style={{ flex: 1, padding: 10, background: colors.bg, border: `0.5px solid ${colors.border}`, color: colors.text, fontSize: 13, fontFamily: fonts.mono, textTransform: 'uppercase' }}
                />
                <button type="submit" style={{ padding: '8px 14px', background: colors.accent, color: '#0a0a0a', border: 'none', fontFamily: fonts.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', cursor: 'pointer' }}>
                  APPROVE
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}