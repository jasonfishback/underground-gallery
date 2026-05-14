import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, applications } from '@/lib/db/schema';
import { CallsignPicker } from '@/components/pending/CallsignPicker';
import { colors, fonts } from '@/lib/design';

const RESERVED = new Set([
  'admin','administrator','root','support','staff','mod','moderator',
  'official','system','undergroundgallery','underground','gallery',
  'me','you','user','users','anonymous','null','undefined',
]);

function clean(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

function buildSuggestion(email: string): string {
  const prefix = clean(email.split('@')[0] || '');
  if (prefix.length >= 3 && prefix.length <= 20 && !RESERVED.has(prefix)) return prefix;
  if (prefix.length < 3) return (prefix + 'user').slice(0, 20);
  return prefix.slice(0, 20);
}

export const dynamic = 'force-dynamic';

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (session.user.status === 'active') redirect('/me');

  const userId = session.user.id!;
  const userEmail = session.user.email!;
  const isPending = session.user.status === 'pending';

  const existingApp = await db.select({ id: applications.id, callsign: applications.callsign })
    .from(applications).where(eq(applications.userId, userId)).limit(1);

  // No app yet -- show callsign picker
  if (existingApp.length === 0) {
    const suggestion = buildSuggestion(userEmail);
    return (
      <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <CallsignPicker email={userEmail} suggestion={suggestion} />
        </div>
      </main>
    );
  }

  // App exists -- show status ui
  const appCallsign = existingApp[0].callsign;

  return (
    <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
      <div className="ug-card" style={{ maxWidth: 520, width: '100%', textAlign: 'center', padding: 32 }}>
        <div className="ug-mono" style={{ fontSize: 11, color: colors.accent, letterSpacing: '0.4em', fontWeight: 700, marginBottom: 16 }}>
          ∕∕ STATUS · {isPending ? 'PENDING REVIEW' : 'NOT APPROVED'}
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          {isPending ? 'Application received.' : 'This door is not yours.'}
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, lineHeight: 1.65, margin: '0 0 32px' }}>
          {isPending
            ? `You are signed in as ${userEmail}. We review every application by hand. When the next door opens, you will hear from us.`
            : 'Your application was not approved this season.'}
        </p>
        <div
          className="ug-mono"
          style={{
            padding: 20,
            border: `1px solid ${colors.border}`,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 12,
            marginBottom: 32,
            fontSize: 12,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            color: colors.textMuted,
            letterSpacing: '0.05em',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textDim }}>CALLSIGN</span>
            <span>@{appCallsign}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textDim }}>EMAIL</span>
            <span>{userEmail}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textDim }}>STATUS</span>
            <span>{session.user.status?.toUpperCase()}</span>
          </div>
        </div>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <button type="submit" className="ug-btn ug-btn-ghost">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
