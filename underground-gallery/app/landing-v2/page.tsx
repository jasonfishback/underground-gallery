// app/landing-v2/page.tsx
//
// Preview of a video-hero landing page. Crossfades the M4 hero clip with
// the UNDERGROUND // GALLERY logo lockup. Mobile-first, killer first frame.

import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Underground Gallery',
  description: 'Invite-only car culture. The cars you actually drive — not the ones you post about.',
};

export const dynamic = 'force-dynamic';

export default async function LandingV2Page() {
  const session = await auth();
  if (session?.user) {
    if (session.user.status === 'active') redirect('/me');
    if (session.user.status === 'pending') redirect('/pending');
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: '#05060a',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Hero video (full-bleed, muted autoplay, looping) */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/og-default.jpg"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/promo-hero.mp4" type="video/mp4" />
      </video>

      {/* Cinematic vignette + bottom darken for text readability */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.55) 100%), ' +
            'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      {/* Crossfading logo lockup — full-screen overlay */}
      <div
        aria-hidden
        className="ug-hero-logo-fade"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(5,6,10,0.78)',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          {/* Mark */}
          <svg width="120" height="120" viewBox="0 0 40 40" fill="none" aria-hidden>
            <rect x="3" y="3" width="34" height="34" stroke="#ff2a2a" strokeWidth="1.5" fill="none" strokeOpacity="0.4" />
            <path d="M3 3 L7 3 M37 3 L33 3 M3 37 L7 37 M37 37 L33 37" stroke="#ff2a2a" strokeWidth="2" strokeLinecap="square" />
            <path d="M8 8 L8 32 L32 32 L32 8" stroke="#ff2a2a" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
            <path d="M25 15 L15 15 L15 27 L25 27 L25 22 L20 22" stroke="#ff2a2a" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
          </svg>
          {/* Wordmark */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontWeight: 700,
              fontSize: 'clamp(18px, 3.2vw, 28px)',
              letterSpacing: '0.22em',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            UNDERGROUND
            <span style={{ color: '#ff2a2a', fontWeight: 900, padding: '0 8px' }}>··</span>
            GALLERY
          </div>
          {/* Tagline */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: '0.4em',
              color: 'rgba(245,246,247,0.55)',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            EST · MMXXVI · INVITE ONLY
          </div>
        </div>
      </div>

      {/* Top bar (always visible above the fade) */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: '0.32em',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: '#ff2a2a',
              boxShadow: '0 0 8px #ff2a2a',
              animation: 'ugBlink 1.6s infinite',
            }}
          />
          <span>SECURED</span>
        </div>
        <Link
          href="/auth/signin"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: '0.3em',
            color: '#fff',
            textDecoration: 'none',
            padding: '8px 14px',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          SIGN IN
        </Link>
      </header>

      {/* Bottom hero copy + CTAs */}
      <section
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          padding: '32px 24px clamp(28px, 6vh, 60px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          alignItems: 'flex-start',
          maxWidth: 760,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: '0.4em',
            color: '#ff2a2a',
            fontWeight: 700,
          }}
        >
          INVITE-ONLY · CAR CULTURE
        </div>
        <h1
          style={{
            fontSize: 'clamp(34px, 6.2vw, 64px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            margin: 0,
            maxWidth: 720,
          }}
        >
          The cars you actually drive.
          <br />
          Not the ones you post about.
        </h1>
        <p
          style={{
            fontSize: 'clamp(14px, 1.4vw, 17px)',
            color: 'rgba(245,246,247,0.78)',
            margin: 0,
            lineHeight: 1.5,
            maxWidth: 540,
          }}
        >
          A members-only gallery for serious builds. Showcase your car, race
          your friends, buy and sell parts inside the network.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <Link
            href="/garage"
            style={{
              padding: '14px 22px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #ff3030, #b80000)',
              color: '#fff',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 12,
              letterSpacing: '0.22em',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(255,42,42,0.32)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            APPLY FOR INVITE →
          </Link>
          <Link
            href="/auth/signin"
            style={{
              padding: '14px 22px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 12,
              letterSpacing: '0.22em',
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            SIGN IN
          </Link>
        </div>
      </section>
    </main>
  );
}
