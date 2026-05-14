import { colors, fonts } from '@/lib/design';

export default function VerifyPage() {
  return (
    <main style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.sans }}>
      <div className="ug-glass" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 11, color: colors.accent, letterSpacing: '0.4em', fontWeight: 700, marginBottom: 16, fontFamily: fonts.mono }}>
          ∕∕ TRANSMISSION SENT
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          Check your <span style={{ color: colors.accent }}>inbox.</span>
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, lineHeight: 1.65, margin: '0 0 32px' }}>
          We&apos;ve sent a sign-in link to your email. Click it to access the gallery. The link expires in 24 hours and only works once.
        </p>
        <p style={{ fontSize: 12, color: colors.textDim, fontFamily: fonts.mono, letterSpacing: '0.1em' }}>
          Sender: accessrestricted@undergroundgallery.ai
        </p>
        <p style={{ marginTop: 32 }}>
          <a href="/auth/signin" className="ug-btn ug-btn-text" style={{ textDecoration: 'none', fontFamily: fonts.mono, fontSize: 11 }}>Use a different email</a>
        </p>
      </div>
    </main>
  );
}
