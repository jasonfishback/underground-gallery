import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Garage · Underground Gallery',
};

export default async function GaragePage() {
  const session = await auth();

  // Not signed in → back to the gate
  if (!session?.user) redirect('/');

  // Signed in but not yet approved → holding pen
  if (session.user.status !== 'active') redirect('/pending');

  const display =
    (session.user as any).callsign ||
    session.user.name ||
    session.user.email?.split('@')[0] ||
    'driver';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#05060a',
        color: '#f5f6f7',
        fontFamily: "'Inter Tight', system-ui, -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Carbon-fiber backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.6,
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px)',
        }}
      />
      {/* Vignette glow */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(ellipse at center, rgba(255,42,42,0.10), transparent 60%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
          padding: '32px 32px 48px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 24,
            borderBottom: '0.5px solid rgba(255,255,255,0.08)',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <rect
                x="3"
                y="3"
                width="34"
                height="34"
                stroke="#ff2a2a"
                strokeWidth="1.5"
                fill="none"
                strokeOpacity="0.4"
              />
              <path
                d="M3 3 L7 3 M37 3 L33 3 M3 37 L7 37 M37 37 L33 37"
                stroke="#ff2a2a"
                strokeWidth="2"
                strokeLinecap="square"
              />
              <path
                d="M8 8 L8 32 L32 32 L32 8"
                stroke="#ff2a2a"
                strokeWidth="3"
                strokeLinecap="square"
                strokeLinejoin="miter"
                fill="none"
              />
              <path
                d="M25 15 L15 15 L15 27 L25 27 L25 22 L20 22"
                stroke="#ff2a2a"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
                fill="none"
              />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.18em',
                }}
              >
                UNDERGROUND
                <span style={{ color: '#ff2a2a', padding: '0 4px', fontWeight: 900 }}>
                  ∕∕
                </span>
                GALLERY
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  color: 'rgba(201,204,209,0.4)',
                  textTransform: 'uppercase',
                }}
              >
                MEMBERS // EST. MMXXVI
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              background: 'rgba(80,200,120,0.08)',
              border: '0.5px solid rgba(80,200,120,0.5)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'rgb(120,220,150)',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                background: 'rgb(120,220,150)',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgb(120,220,150)',
              }}
            />
            <span>ACCESS GRANTED</span>
          </div>
        </header>

        {/* Main hero */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '48px 0 32px',
            gap: 32,
          }}
        >
          {/* Hero mark */}
          <div style={{ width: 200, height: 200, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none">
              <g stroke="#ff2a2a" strokeWidth="1" opacity="0.4">
                <path d="M2 6 L10 6 M6 2 L6 10" />
                <path d="M118 6 L110 6 M114 2 L114 10" />
                <path d="M2 114 L10 114 M6 110 L6 118" />
                <path d="M118 114 L110 114 M114 110 L114 118" />
              </g>
              <rect
                x="14"
                y="14"
                width="92"
                height="92"
                stroke="#ff2a2a"
                strokeWidth="1.5"
                fill="none"
                strokeOpacity="0.35"
              />
              <path
                d="M14 14 L26 14 M106 14 L94 14 M14 106 L26 106 M106 106 L94 106"
                stroke="#ff2a2a"
                strokeWidth="3"
                strokeLinecap="square"
              />
              <path
                d="M28 24 L28 92 L92 92 L92 24"
                stroke="#ff2a2a"
                strokeWidth="8"
                strokeLinecap="square"
                strokeLinejoin="miter"
                fill="none"
              />
              <path
                d="M80 44 L42 44 L42 80 L80 80 L80 64 L60 64"
                stroke="#ff2a2a"
                strokeWidth="5"
                strokeLinecap="square"
                strokeLinejoin="miter"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="56"
                stroke="#ff2a2a"
                strokeWidth="0.5"
                strokeOpacity="0.25"
                strokeDasharray="2 4"
              />
            </svg>
          </div>

          {/* Welcome */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#ff2a2a',
              letterSpacing: '0.4em',
              fontWeight: 700,
            }}
          >
            ∕∕ WELCOME BACK
          </div>
          <h1
            style={{
              fontSize: 'clamp(36px, 7vw, 72px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 0.95,
              margin: 0,
            }}
          >
            <span style={{ color: '#ff2a2a' }}>{display}</span>.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(201,204,209,0.75)',
              lineHeight: 1.65,
              maxWidth: 460,
              margin: 0,
            }}
          >
            The doors are open. The gallery itself opens soon — we're still building
            what's inside. You'll be the first to know when it does.
          </p>

          {/* Status panel */}
          <div
            style={{
              width: '100%',
              maxWidth: 460,
              padding: 20,
              background: 'rgba(255,255,255,0.02)',
              border: '0.5px solid rgba(255,255,255,0.08)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              color: 'rgba(201,204,209,0.7)',
              letterSpacing: '0.05em',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(201,204,209,0.45)' }}>EMAIL</span>
              <span>{session.user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(201,204,209,0.45)' }}>STATUS</span>
              <span style={{ color: 'rgb(120,220,150)' }}>ACTIVE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(201,204,209,0.45)' }}>SEASON</span>
              <span>01</span>
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
                color: 'rgba(201,204,209,0.5)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              SIGN OUT
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer
          style={{
            paddingTop: 24,
            borderTop: '0.5px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(201,204,209,0.4)',
          }}
        >
          <div>© MMXXVI · UNDERGROUND GALLERY</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ color: 'rgba(201,204,209,0.6)', textDecoration: 'none' }}>
              PRIVACY
            </a>
            <a href="/terms" style={{ color: 'rgba(201,204,209,0.6)', textDecoration: 'none' }}>
              TERMS
            </a>
            <a
              href="mailto:info@undergroundgallery.ai"
              style={{ color: 'rgba(201,204,209,0.6)', textDecoration: 'none' }}
            >
              CONTACT
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
