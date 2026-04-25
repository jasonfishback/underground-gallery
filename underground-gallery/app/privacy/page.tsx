import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function Privacy() {
  return (
    <main style={pageStyle}>
      <Header />
      <article style={articleStyle}>
        <p style={kickerStyle}>∕∕ PRIVACY POLICY</p>
        <h1 style={h1Style}>Privacy Policy</h1>
        <p style={metaStyle}>Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <h2 style={h2Style}>What we collect</h2>
        <p>When you apply to Underground Gallery, we collect the email address you submit and any optional information you provide (callsign, region, primary drive, Instagram handle, who invited you, message). We also log your IP address and browser user-agent at the time of application for abuse prevention.</p>

        <h2 style={h2Style}>How we use it</h2>
        <p>We use your application data to:</p>
        <ul>
          <li>Review your application by hand and decide whether to send you an invitation.</li>
          <li>Send you the confirmation email after you apply.</li>
          <li>Send you an invitation if and when you are accepted.</li>
          <li>Detect and prevent spam, fraud, and abuse.</li>
        </ul>

        <h2 style={h2Style}>How we store it</h2>
        <p>Application data is stored in Vercel KV (Redis). Email is sent through Resend. Web analytics are collected via Vercel Analytics in an aggregated, anonymized form. We do not sell your data, ever.</p>

        <h2 style={h2Style}>How long we keep it</h2>
        <p>Pending applications are kept indefinitely until acted on. If you ask us to delete your data, email <a style={linkStyle} href="mailto:info@undergroundgallery.ai">info@undergroundgallery.ai</a> and we will purge it within 30 days.</p>

        <h2 style={h2Style}>Cookies</h2>
        <p>We set a single first-party cookie named <code style={codeStyle}>ug_view</code> to remember whether you prefer the desktop or mobile experience. We do not use third-party advertising cookies.</p>

        <h2 style={h2Style}>Your rights</h2>
        <p>You can ask for a copy of your data, ask us to correct it, or ask us to delete it. Email <a style={linkStyle} href="mailto:info@undergroundgallery.ai">info@undergroundgallery.ai</a>.</p>

        <h2 style={h2Style}>Contact</h2>
        <p>Underground Gallery<br/>
        <a style={linkStyle} href="mailto:info@undergroundgallery.ai">info@undergroundgallery.ai</a></p>
      </article>
      <Footer />
    </main>
  );
}

// ─── Shared styles + chrome ───────────────────────────────────────────────

function Header() {
  return (
    <header style={headerStyle}>
      <Link href="/" style={{ ...linkStyle, fontFamily: '"JetBrains Mono",monospace', fontSize: 11, letterSpacing: '0.3em', textDecoration: 'none', color: '#f5f6f7', fontWeight: 700 }}>
        ∕∕ UNDERGROUND&nbsp;GALLERY
      </Link>
    </header>
  );
}

function Footer() {
  return (
    <footer style={footerStyle}>
      <Link href="/privacy" style={footerLinkStyle}>Privacy</Link>
      <Link href="/terms" style={footerLinkStyle}>Terms</Link>
      <a href="mailto:info@undergroundgallery.ai" style={footerLinkStyle}>Contact</a>
      <a href="https://instagram.com/undergroundgalleryai" target="_blank" rel="noopener noreferrer" style={footerLinkStyle}>@undergroundgalleryai</a>
    </footer>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', background: '#05060a', color: '#c9ccd1',
  fontFamily: '"Inter Tight",system-ui,sans-serif',
  padding: '40px 24px 80px',
};
const headerStyle: React.CSSProperties = {
  maxWidth: 720, margin: '0 auto 48px', paddingBottom: 24,
  borderBottom: '0.5px solid rgba(255,255,255,0.1)',
};
const articleStyle: React.CSSProperties = {
  maxWidth: 720, margin: '0 auto', lineHeight: 1.7, fontSize: 15,
};
const kickerStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#ff2a2a',
  letterSpacing: '0.3em', fontWeight: 700, margin: '0 0 16px',
};
const h1Style: React.CSSProperties = {
  fontSize: 40, fontWeight: 800, color: '#f5f6f7', letterSpacing: '-0.02em',
  margin: '0 0 12px',
};
const h2Style: React.CSSProperties = {
  fontSize: 18, fontWeight: 700, color: '#f5f6f7', letterSpacing: '-0.01em',
  margin: '32px 0 12px',
};
const metaStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: 'rgba(201,204,209,0.5)',
  letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 24px',
};
const linkStyle: React.CSSProperties = { color: '#ff2a2a', textDecoration: 'underline' };
const codeStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono",monospace', fontSize: 13,
  background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 2,
};
const footerStyle: React.CSSProperties = {
  maxWidth: 720, margin: '64px auto 0', paddingTop: 32,
  borderTop: '0.5px solid rgba(255,255,255,0.1)',
  display: 'flex', gap: 24, flexWrap: 'wrap',
  fontFamily: '"JetBrains Mono",monospace', fontSize: 11, letterSpacing: '0.18em',
  textTransform: 'uppercase',
};
const footerLinkStyle: React.CSSProperties = {
  color: 'rgba(201,204,209,0.6)', textDecoration: 'none',
};
