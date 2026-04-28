import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, applications } from '@/lib/db/schema';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';

async function approveAction(formData: FormData) {
  'use server';
  const appId = String(formData.get('appId') || '').trim();
  if (!appId) return;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth/signin?next=/approve/${appId}`);

  // Look up the application
  const [app] = await db.select().from(applications).where(eq(applications.id, appId)).limit(1);
  if (!app) return;

  // Verify the approving user is the inviter (or an admin)
  const [me] = await db.select({ id: users.id, isModerator: users.isModerator }).from(users).where(eq(users.id, session.user.id)).limit(1);
  const isInviter = app.invitedBy === me?.id;
  const isAdmin = me?.isModerator === true;
  if (!isInviter && !isAdmin) return;

  if (app.status !== 'pending') return; // Already decided

  // Approve
  const [target] = await db.select().from(users).where(eq(users.id, app.userId)).limit(1);
  if (!target || !target.email) return;

  const finalCallsign = target.callsign ?? app.callsign ?? target.email.split('@')[0];

  await db.update(applications).set({
    status: 'approved',
    decidedAt: new Date(),
    decidedBy: me!.id,
  }).where(eq(applications.id, appId));

  await db.update(users).set({
    status: 'active',
    callsign: finalCallsign,
    approvedAt: new Date(),
  }).where(eq(users.id, app.userId));

  // Send welcome email to the new member
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'accessrestricted@undergroundgallery.ai';
  const fromName = process.env.RESEND_FROM_NAME || 'Underground Gallery';
  if (apiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: target.email,
          subject: `You're in. // ACCESS GRANTED`,
          html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#05060a;color:#f5f6f7;padding:40px 24px;margin:0;">
<div style="max-width:480px;margin:0 auto;text-align:center;">
<div style="font-family:monospace;font-size:11px;letter-spacing:0.4em;color:#ff2a2a;font-weight:700;margin-bottom:16px;">ACCESS GRANTED</div>
<h1 style="font-size:36px;font-weight:800;margin:0 0 16px;">You're in, ${finalCallsign}.</h1>
<p style="font-size:15px;color:rgba(201,204,209,0.75);line-height:1.65;margin:0 0 32px;">Welcome to Underground Gallery. The room is yours.</p>
<a href="https://undergroundgallery.ai/me" style="display:inline-block;padding:14px 32px;background:#ff2a2a;color:#0a0a0a;text-decoration:none;font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.4em;">ENTER THE GARAGE</a>
</div></body></html>`,
          text: `You're in, ${finalCallsign}. Visit https://undergroundgallery.ai/me`,
        }),
      });
    } catch (e) { console.error('Welcome email failed:', e); }
  }

  redirect(`/approve/${appId}?done=1`);
}

export default async function ApprovePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ done?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: colors.accent, fontFamily: fonts.mono, letterSpacing: '0.4em', marginBottom: 16 }}>SIGN IN REQUIRED</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>Sign in to approve.</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>You need to sign in with the email tied to your invite code first.</p>
          <a href={`/auth/signin?next=/approve/${id}`} style={{ display: 'inline-block', padding: '14px 28px', background: colors.accent, color: '#0a0a0a', textDecoration: 'none', fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.4em' }}>SIGN IN</a>
        </div>
      </main>
    );
  }

  const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);

  if (!app) {
    return (
      <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>Link not found.</h1>
          <p style={{ fontSize: 14, color: colors.textMuted }}>This approval link is invalid or expired.</p>
        </div>
      </main>
    );
  }

  const [me] = await db.select({ id: users.id, isModerator: users.isModerator, callsign: users.callsign }).from(users).where(eq(users.id, session.user.id)).limit(1);
  const isInviter = app.invitedBy === me?.id;
  const isAdmin = me?.isModerator === true;

  if (!isInviter && !isAdmin) {
    return (
      <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>Not your invite.</h1>
          <p style={{ fontSize: 14, color: colors.textMuted }}>Only the original inviter or an admin can approve this user.</p>
        </div>
      </main>
    );
  }

  const [target] = await db.select({ email: users.email, callsign: users.callsign }).from(users).where(eq(users.id, app.userId)).limit(1);

  if (sp.done === '1' || app.status === 'approved') {
    return (
      <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgb(120,220,150)', fontFamily: fonts.mono, letterSpacing: '0.4em', marginBottom: 16 }}>APPROVED</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>{target?.email} is in.</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>They got the welcome email. Tell them to check their inbox.</p>
          <a href="/me" style={{ display: 'inline-block', padding: '12px 24px', background: 'transparent', color: colors.text, border: `0.5px solid ${colors.border}`, textDecoration: 'none', fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.3em' }}>BACK TO GARAGE</a>
        </div>
      </main>
    );
  }

  if (app.status === 'rejected') {
    return (
      <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>Already decided.</h1>
          <p style={{ fontSize: 14, color: colors.textMuted }}>This application was rejected by an admin.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: colors.accent, fontFamily: fonts.mono, letterSpacing: '0.4em', marginBottom: 16 }}>VOUCH FOR YOUR INVITE</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px' }}>{target?.email}</h1>
        <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32, lineHeight: 1.6 }}>
          They used your invite code. Approving lets them into the garage immediately.
        </p>
        <form action={approveAction}>
          <input type="hidden" name="appId" value={id} />
          <button type="submit" style={{ width: '100%', padding: '16px 24px', background: colors.accent, color: '#0a0a0a', border: 'none', fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, letterSpacing: '0.4em', cursor: 'pointer', marginBottom: 16 }}>
            APPROVE
          </button>
        </form>
        <a href="/me" style={{ display: 'inline-block', padding: '12px 24px', color: colors.textMuted, textDecoration: 'none', fontFamily: fonts.mono, fontSize: 10, letterSpacing: '0.3em' }}>NOT NOW</a>
      </div>
    </main>
  );
}