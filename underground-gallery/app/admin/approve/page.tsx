import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, applications } from '@/lib/db/schema';
import { customAlphabet } from 'nanoid';
import { colors, fonts } from '@/lib/design';

const newId = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz', 10);

export const dynamic = 'force-dynamic';

async function approveByEmail(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.id) return;
  const [me] = await db.select({ isModerator: users.isModerator }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!me?.isModerator) return;

  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email) return;

  const [target] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!target) return;

  // Ensure they have an application row (create one if missing)
  const existingApp = await db.select().from(applications).where(eq(applications.userId, target.id)).limit(1);
  if (existingApp.length === 0) {
    await db.insert(applications).values({
      id: newId(),
      userId: target.id,
      callsign: target.callsign ?? email.split('@')[0],
      status: 'active',
      submittedAt: new Date(),
      decidedAt: new Date(),
      decidedBy: session.user.id,
    } as any);
  } else {
    await db.update(applications).set({
      status: 'active',
      decidedAt: new Date(),
      decidedBy: session.user.id,
    }).where(eq(applications.userId, target.id));
  }

  // Approve the user
  await db.update(users).set({ status: 'active', approvedAt: new Date() }).where(eq(users.id, target.id));
  redirect('/admin/approve?ok=' + encodeURIComponent(email));
}

export default async function QuickApprovePage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  const [me] = await db.select({ isModerator: users.isModerator }).from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!me?.isModerator) redirect('/');

  const sp = await searchParams;
  const ok = sp?.ok;

  // Show all pending users for context
  const pending = await db.select({
    id: users.id,
    email: users.email,
    callsign: users.callsign,
    status: users.status,
    createdAt: users.createdAt,
  }).from(users).orderBy(sql`${users.createdAt} DESC`).limit(20);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: fonts.sans, color: colors.text, background: colors.bg, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, fontFamily: fonts.mono, marginBottom: 24 }}>
        QUICK APPROVE
      </h1>

      {ok && (
        <div style={{ padding: 16, background: 'rgba(120,220,150,0.1)', border: '0.5px solid rgb(120,220,150)', color: 'rgb(120,220,150)', marginBottom: 24, fontFamily: fonts.mono, fontSize: 12 }}>
          APPROVED: {ok}
        </div>
      )}

      <form action={approveByEmail} style={{ marginBottom: 32 }}>
        <input
          type="email"
          name="email"
          placeholder="email to approve"
          required
          style={{ width: '100%', padding: 14, fontSize: 16, background: colors.bgElevated, border: `0.5px solid ${colors.border}`, color: colors.text, marginBottom: 12, boxSizing: 'border-box' }}
        />
        <button type="submit" style={{ padding: '12px 20px', background: colors.accent, color: '#0a0a0a', border: 'none', fontFamily: fonts.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', cursor: 'pointer' }}>
          APPROVE USER
        </button>
      </form>

      <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: fonts.mono, letterSpacing: '0.2em', marginBottom: 12 }}>
        RECENT USERS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pending.map((u) => (
          <div key={u.id} style={{ padding: 12, border: `0.5px solid ${colors.border}`, background: colors.bgElevated, fontFamily: fonts.mono, fontSize: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
            <div>
              <div>{u.email}</div>
              <div style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
                {u.callsign ?? '—'} · {u.status?.toUpperCase()}
              </div>
            </div>
            <span style={{ color: u.status === 'active' ? 'rgb(120,220,150)' : colors.accent, fontWeight: 700 }}>
              {u.status === 'active' ? 'ACTIVE' : 'PENDING'}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}