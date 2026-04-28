import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, applications } from '@/lib/db/schema';
import { CallsignPicker } from '@/components/pending/CallsignPicker';

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
      <main style={{ minHeight: '100vh', background: '#05060a', color: '#f5f6f7', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <CallsignPicker email={userEmail} suggestion={suggestion} />
        </div>
      </main>
    );
  }

  // App exists -- show status ui
  const appCallsign = existingApp[0].callsign;

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
          <div>CALLSIGN: @{appCallsign}</div>
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