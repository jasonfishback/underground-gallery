import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, applications, inviteCodes } from '@/lib/db/schema';
import { customAlphabet } from 'nanoid';

const newId = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz', 10);

export const dynamic = 'force-dynamic';

async function notifyAdminOfNewSignup(email: string, inviterCallsign: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'accessrestricted@undergroundgallery.ai';
  const fromName = process.env.RESEND_FROM_NAME || 'Underground Gallery';
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  if (!apiKey || adminEmails.length === 0) return;
  const inviter = inviterCallsign ? `@${inviterCallsign}` : 'an unknown member';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: adminEmails,
        subject: `New application: ${email}`,
        html: `<div style="font-family:system-ui,sans-serif;background:#05060a;color:#f5f6f7;padding:32px;">
<div style="font-family:monospace;font-size:11px;letter-spacing:0.4em;color:#ff2a2a;font-weight:700;margin-bottom:12px;">NEW APPLICATION</div>
<h1 style="font-size:24px;margin:0 0 16px;">${email}</h1>
<p style="font-size:14px;color:rgba(201,204,209,0.75);">Invited by ${inviter}</p>
<a href="https://undergroundgallery.ai/admin/approve" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ff2a2a;color:#0a0a0a;text-decoration:none;font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.4em;">REVIEW &rarr;</a>
</div>`,
        text: `New application from ${email}, invited by ${inviter}. Review at https://undergroundgallery.ai/admin/approve`,
      }),
    });
  } catch (e) {
    console.error('Admin notify failed:', e);
  }
}

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (session.user.status === 'active') redirect('/me');

  const userId = session.user.id;
  const userEmail = session.user.email!;
  const isPending = session.user.status === 'pending';

  // Auto-create application row from invite cookie if missing
  const existingApp = await db.select().from(applications).where(eq(applications.userId, userId)).limit(1);
  if (existingApp.length === 0) {
    const cookieStore = await cookies();
    const inviteCode = cookieStore.get('ug_invite')?.value;
    let inviterId: string | null = null;
    let inviterCallsign: string | null = null;
    if (inviteCode) {
      const inv = await db
        .select({ ownerId: inviteCodes.ownerUserId })
        .from(inviteCodes)
        .where(sql`LOWER(${inviteCodes.code}) = LOWER(${inviteCode})`)
        .limit(1);
      if (inv.length > 0) {
        inviterId = inv[0].ownerId;
        const ownerRow = await db.select({ callsign: users.callsign }).from(users).where(eq(users.id, inviterId)).limit(1);
        inviterCallsign = ownerRow[0]?.callsign ?? null;
      }
    }
    await db.insert(applications).values({
      id: newId(),
      userId,
      callsign: userEmail.split('@')[0],
      status: 'pending',
      invitedBy: inviterId,
      submittedAt: new Date(),
    } as any);
    await notifyAdminOfNewSignup(userEmail, inviterCallsign);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#05060a', color: '#f5f6f7', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#ff2a2a', letterSpacing: '0.4em', fontWeight: 700, marginBottom: 16, fontFamily: 'monospace' }}>
          STATUS · {isPending ? 'PENDING REVIEW' : 'NOT APPROVED'}
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 20px' }}>
          {isPending ? 'Application received.' : 'This door is not yours.'}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(201,204,209,0.75)', lineHeight: 1.65, margin: '0 0 32px' }}>
          {isPending
            ? `You are signed in as ${userEmail}. We review every application by hand. When the next door opens, you will hear from us.`
            : 'Your application was not approved this season.'}
        </p>
        <div style={{ padding: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', marginBottom: 32, fontFamily: 'monospace', fontSize: 12, textAlign: 'left' }}>
          <div>EMAIL: {userEmail}</div>
          <div>STATUS: {session.user.status?.toUpperCase()}</div>
        </div>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <button type="submit" style={{ padding: '12px 24px', background: 'transparent', color: 'rgba(201,204,209,0.7)', border: '1px solid rgba(255,255,255,0.18)', fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}