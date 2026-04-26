// app/auth/verify/page.tsx
// Shown after user submits their email on /auth/signin.
// Tells them to check their inbox.

export default function VerifyPage() {
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
          maxWidth: 460,
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
          ∕∕ TRANSMISSION SENT
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
          Check your <span style={{ color: '#ff2a2a' }}>inbox.</span>
        </h1>

        <p
          style={{
            fontSize: 15,
            color: 'rgba(201,204,209,0.75)',
            lineHeight: 1.65,
            margin: '0 0 32px',
          }}
        >
          We've sent a sign-in link to your email. Click it to access the gallery.
          The link expires in 24 hours and only works once.
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
            ∕∕ TROUBLESHOOTING
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 13,
              color: 'rgba(201,204,209,0.65)',
              lineHeight: 1.7,
            }}
          >
            <li>Check spam/junk if it's not in your inbox</li>
            <li>The sender is <span style={{ color: '#f5f6f7', fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>accessrestricted@undergroundgallery.ai</span></li>
            <li>Subject line starts with "Sign in to..."</li>
            <li>Wait a minute before requesting another link</li>
          </ul>
        </div>

        
          href="/auth/signin"
          style={{
            color: 'rgba(201,204,209,0.6)',
            textDecoration: 'none',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          ← USE A DIFFERENT EMAIL
        </a>
      </div>
    </main>
  );
}
