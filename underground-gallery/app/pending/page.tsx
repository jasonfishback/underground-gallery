// app/pending/page.tsx
// Where users land after clicking the magic link.
// Server-rendered: reads session from DB, branches on user.status.
//
//   - pending  → "We're reviewing your application" message
//   - rejected → "Your application wasn't approved" (rare path)
//   - active   → Redirect to /garage (members area)
//   - no session → Redirect to /auth/signin

import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PendingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.status === 'active') {
    redirect('/garage');
  }

  const isPending = session.user.status === 'pending';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#05060a',
        color: '#f5f6f7',
        fontFamily: '"Inter Tight", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.5,
          background:
            'radial-gradient(ellipse at top, rgba(255,42,42,0.06), transparent 60%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: '#ff2a2a',
            letterSpacing: '0.4em',
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          ∕∕ STATUS · {isPending ? 'PENDING REVIEW' : 'NOT APPROVED'}
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 6vw, 48px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            margin: '0 0 20px',
          }}
        >
          {isPending ? (
            <>
              Application <span style={{ color: '#ff2a2a' }}>received.</span>
            </>
          ) : (
            <>This door <span style={{ color: '#ff2a2a' }}>isn't yours.</span></>
          )}
        </h1>

        <p
          style={{
            fontSize: 15,
            color: 'rgba(201,204,209,0.75)',
            lineHeight: 1.65,
            margin: '0 0 32px',
          }}
        >
          {isPending ? (
            <>
              You're signed in as{' '}
              <span style={{ color: '#f5f6f7', fontFamily: '"JetBrains Mono", monospace', fontSize: 13 }}>
                {session.user.email}
              </span>
              . We review every application by hand — when the next door opens, you'll
              hear from us. No need to check back.
            </>
          ) : (
            <>
              Your application wasn't approved this season. The doors will open again. If
              you think this is a mistake, write back from the email you applied with.
            </>
          )}
        </p>

        <div
          style={{
            padding: 20,
            border: '0.5px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: 32,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: 'rgba(201,204,209,0.5)',
              letterSpacing: '0.3em',
              marginBottom: 12,
            }}
          >
            ∕∕ ACCOUNT STATUS
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12,
              color: 'rgba(201,204,209,0.7)',
              lineHeight: 1.8,
            }}
          >
            <div>
              EMAIL ·{' '}
              <span style={{ color: '#f5f6f7' }}>{session.user.email}</span>
            </div>
            <div>
              STATUS ·{' '}
              <span
                style={{
                  color: isPending ? '#ff2a2a' : 'rgba(201,204,209,0.5)',
                  fontWeight: 700,
                }}
              >
                {session.user.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: 'rgba(201,204,209,0.7)',
              border: '0.5px solid rgba(255,255,255,0.18)',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            SIGN OUT
          </button>
        </form>
      </div>
    </main>
  );
}
