export default function VerifyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#05060a', color: '#f5f6f7', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#ff2a2a', letterSpacing: '0.4em', fontWeight: 700, marginBottom: 16, fontFamily: 'monospace' }}>
          TRANSMISSION SENT
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 20px' }}>
          Check your <span style={{ color: '#ff2a2a' }}>inbox.</span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(201,204,209,0.75)', lineHeight: 1.65, margin: '0 0 32px' }}>
          We&apos;ve sent a sign-in link to your email. Click it to access the gallery. The link expires in 24 hours and only works once.
        </p>
        <p style={{ fontSize: 12, color: 'rgba(201,204,209,0.5)' }}>
          Sender: accessrestricted@undergroundgallery.ai
        </p>
        <p style={{ marginTop: 32 }}>
          <a href="/auth/signin" style={{ color: 'rgba(201,204,209,0.6)', fontFamily: 'monospace', fontSize: 11 }}>Use a different email</a>
        </p>
      </div>
    </main>
  );
}
