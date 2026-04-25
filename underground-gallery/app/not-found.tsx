import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh', background: '#05060a', color: '#f5f6f7',
      fontFamily: '"Inter Tight",system-ui,sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center',
    }}>
      <p style={{
        fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#ff2a2a',
        letterSpacing: '0.3em', fontWeight: 700, margin: '0 0 24px',
      }}>∕∕ ACCESS DENIED · 404</p>

      <h1 style={{
        fontSize: 'clamp(48px, 10vw, 96px)', fontWeight: 800,
        margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1,
      }}>This door isn't yours.</h1>

      <p style={{
        fontSize: 16, color: 'rgba(201,204,209,0.7)', maxWidth: 480, lineHeight: 1.6,
        margin: '0 0 40px',
      }}>
        Either the page has been moved, your invite has expired, or you weren't supposed to see this in the first place.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{
          display: 'inline-block', padding: '14px 24px',
          background: '#ff2a2a', color: '#0a0a0a',
          fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.3em', textDecoration: 'none', textTransform: 'uppercase',
        }}>← Back to the door</Link>
      </div>
    </main>
  );
}
