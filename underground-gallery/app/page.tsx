// app/page.tsx
//
// Members-only landing page (root URL). Replaces the previous 404-on-root.
// Visual treatment lifted from the design handoff in
// /design_handoff_underground_gallery/README.md (Mobile redesign):
//   - Chrome-textured UNDERGROUND wordmark with subtle 3D rotisserie
//   - Corner crosshair brackets
//   - Hero copy: "Access the gallery."
//   - Two CTAs: tinted-glass primary (Send sign-in link) + clear-glass
//     secondary (I have a code)
//   - Film-grain + vignette overlay for the analog/cinematic feel
//
// Authenticated members hitting `/` are bounced to /me. Pending members go to
// /pending. Everyone else sees this.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { BootIntro } from '@/components/landing/BootIntro';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Members only',
  description: 'Underground Gallery is a members-only space. Sign in or use your invite code.',
};

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    if (session.user.status === 'active') redirect('/me');
    if (session.user.status === 'pending') redirect('/pending');
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(255,42,42,0.12), transparent 55%), ' +
          'radial-gradient(ellipse at 50% 95%, rgba(255,42,42,0.06), transparent 60%), ' +
          '#05060a',
        color: '#f5f6f7',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Inter Tight", system-ui, sans-serif',
      }}
    >
      {/* Cinematic boot-up overlay. Plays once per browser session, then
          unmounts so the landing below is interactive. Tap-to-skip. */}
      <BootIntro />
      {/* Top bar */}
      <header
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 4,
        }}
      >
        <span
          className="ug-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.32em',
            fontWeight: 700,
            color: 'rgba(201,204,209,0.55)',
          }}
        >
          ∕∕ UG
        </span>
        <span
          className="ug-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.32em',
            color: 'rgba(201,204,209,0.38)',
          }}
        >
          SESSION · 0x{Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .toUpperCase()
            .padStart(6, '0')}
        </span>
      </header>

      {/* Decorative corner crosshairs */}
      <div className="ug-corners">
        <div className="ug-corner ug-corner-tl" />
        <div className="ug-corner ug-corner-tr" />
        <div className="ug-corner ug-corner-bl" />
        <div className="ug-corner ug-corner-br" />
      </div>

      {/* Vignette + grain (decorative overlays) */}
      <div className="ug-vignette" style={{ zIndex: 1 }} />
      <div className="ug-grain" style={{ zIndex: 2 }} />

      {/* Center content stack */}
      <section
        style={{
          position: 'relative',
          zIndex: 3,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          padding: '32px 24px',
          maxWidth: 480,
          margin: '0 auto',
          gap: 24,
        }}
      >
        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span className="ug-wordmark">UNDERGROUND · GALLERY</span>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span
            className="ug-mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.4em',
              color: '#ff2a2a',
              textTransform: 'uppercase',
            }}
          >
            ∕∕ Access Restricted · Members
          </span>
          <h1
            style={{
              fontSize: 'clamp(34px, 8vw, 48px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: 0,
              color: '#f5f6f7',
            }}
          >
            Access the gallery.
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.45,
              color: 'rgba(232,228,224,0.62)',
              margin: '0 auto',
              maxWidth: 360,
            }}
          >
            Members run the lot. Sign in to your stall, or punch in an invite code if you've got one.
          </p>
        </div>

        {/* CTA stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <Link
            href="/auth/signin"
            className="ug-glass-tinted"
            style={ctaStyle}
          >
            <span style={{ position: 'relative', zIndex: 2 }}>Send sign-in link</span>
            <span className="ug-shimmer" />
          </Link>
          <Link
            href="/auth/signin?mode=code"
            className="ug-glass"
            style={{ ...ctaStyle, color: 'rgba(245,246,247,0.85)' }}
          >
            <span style={{ position: 'relative', zIndex: 2 }}>I have a code</span>
            <span className="ug-shimmer" />
          </Link>
        </div>

        {/* Footer micro-row */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span
            className="ug-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.32em',
              color: 'rgba(201,204,209,0.38)',
            }}
          >
            NEW HERE? —{' '}
            <a
              href="mailto:hello@undergroundgallery.ai?subject=Invite request"
              style={{ color: '#ff5252', textDecoration: 'none' }}
            >
              REQUEST INVITATION
            </a>
          </span>
        </div>
      </section>

      {/* Bottom-left status, bottom-right session id (matches handoff) */}
      <footer
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 4,
        }}
      >
        <span
          className="ug-mono"
          style={{ fontSize: 10, letterSpacing: '0.32em', color: 'rgba(201,204,209,0.38)' }}
        >
          EST · MMXXVI · INVITE-ONLY
        </span>
        <Link
          href="/privacy"
          className="ug-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.32em',
            color: 'rgba(201,204,209,0.38)',
            textDecoration: 'none',
          }}
        >
          PRIVACY · TERMS · CONTACT
        </Link>
      </footer>
    </main>
  );
}

const ctaStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 56,
  borderRadius: 14,
  fontSize: 15,
  fontWeight: 600,
  color: '#f5f6f7',
  textDecoration: 'none',
  overflow: 'hidden',
  fontFamily: '"Inter Tight", system-ui, sans-serif',
};
