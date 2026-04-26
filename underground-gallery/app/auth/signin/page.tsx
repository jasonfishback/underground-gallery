// app/auth/signin/page.tsx
// Custom sign-in page. Replaces NextAuth's default UI.
//
// Flow:
//   1. User enters email → POSTs to /api/auth/signin/resend
//   2. Auth.js creates verification token, sends magic link
//   3. User redirected to /auth/verify ("check your email")

'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function SignInForm() {
  const params = useSearchParams();
  const error = params?.get('error');

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    error ? mapAuthError(error) : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('VALID EMAIL REQUIRED');
      return;
    }

    setSubmitting(true);
    try {
      await signIn('resend', {
        email: email.trim().toLowerCase(),
        redirectTo: '/pending',
      });
    } catch (err) {
      setErrorMsg('TRANSMISSION FAILED · TRY AGAIN');
      setSubmitting(false);
    }
  };

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

      <div style={{ position: 'relative', maxWidth: 460, width: '100%' }}>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: '#ff2a2a',
            letterSpacing: '0.4em',
            fontWeight: 700,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          ∕∕ ACCESS RESTRICTED · SIGN IN
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 52px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1,
            margin: '0 0 16px',
            textAlign: 'center',
          }}
        >
          Members <span style={{ color: '#ff2a2a' }}>only.</span>
        </h1>

        <p
          style={{
            fontSize: 14,
            color: 'rgba(201,204,209,0.7)',
            lineHeight: 1.6,
            textAlign: 'center',
            margin: '0 0 36px',
          }}
        >
          Enter your email. If you have access, we'll send you a sign-in link.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: 'rgba(201,204,209,0.7)',
              letterSpacing: '0.25em',
              marginBottom: 10,
            }}
          >
            EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@domain.com"
            required
            autoFocus
            autoComplete="email"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(0,0,0,0.4)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              color: '#f5f6f7',
              fontSize: 16,
              fontFamily: 'inherit',
              marginBottom: 24,
              boxSizing: 'border-box',
            }}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: '#ff2a2a',
              color: '#05060a',
              border: 'none',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.5 : 1,
              boxShadow: '0 0 24px rgba(255,42,42,0.25)',
            }}
          >
            {submitting ? 'TRANSMITTING…' : 'SEND SIGN-IN LINK →'}
          </button>

          {errorMsg && (
            <div
              style={{
                marginTop: 20,
                padding: 14,
                border: '0.5px solid #ff2a2a',
                background: 'rgba(255,42,42,0.08)',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11,
                color: '#ff2a2a',
                letterSpacing: '0.1em',
              }}
            >
              ∕∕ ERROR · {errorMsg}
            </div>
          )}
        </form>

        <p
          style={{
            marginTop: 32,
            fontSize: 12,
            color: 'rgba(201,204,209,0.5)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          New here?{' '}
          
            href="/#apply"
            style={{ color: '#ff2a2a', textDecoration: 'none' }}
          >
            Request an invitation
          </a>
          .
        </p>

        <p
          style={{
            marginTop: 12,
            fontSize: 12,
            color: 'rgba(201,204,209,0.5)',
            textAlign: 'center',
          }}
        >
          
            href="/"
            style={{
              color: 'rgba(201,204,209,0.5)',
              textDecoration: 'none',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
            }}
          >
            ← BACK TO LANDING
          </a>
        </p>
      </div>
    </main>
  );
}

function mapAuthError(code: string): string {
  switch (code) {
    case 'AccessDenied':
      return 'ACCESS DENIED · YOU
