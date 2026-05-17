import Link from 'next/link';
import { colors, fonts } from '@/lib/design';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh', background: colors.bg, color: colors.text,
      fontFamily: fonts.sans,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center',
    }}>
      <div className="ug-card" style={{ padding: 40, maxWidth: 560, width: '100%' }}>
        <p style={{
          fontFamily: fonts.mono, fontSize: 11, color: colors.accent,
          letterSpacing: '0.3em', fontWeight: 700, margin: '0 0 24px',
        }}>∕∕ ACCESS DENIED · 404</p>

        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 800,
          margin: '0 0 12px', letterSpacing: '-0.03em', lineHeight: 1,
          color: colors.text,
        }}>This door isn't yours.</h1>

        <p style={{
          fontSize: 16, color: colors.textMuted, maxWidth: 440, lineHeight: 1.6,
          margin: '0 auto 32px',
        }}>
          Either the page has been moved, your invite has expired, or you weren't supposed to see this in the first place.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" className="ug-btn ug-btn-primary" style={{ textDecoration: 'none' }}>
            ← Back to the door
          </Link>
        </div>
      </div>
    </main>
  );
}
