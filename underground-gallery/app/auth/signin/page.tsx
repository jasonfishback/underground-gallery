'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { colors, fonts } from '@/lib/design';

function SignInForm() {
  const params = useSearchParams();
  const errorParam = params?.get('error');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    errorParam ? 'That code or link was invalid or expired. Try again.' : null,
  );
  // Two-step: 'email' → send code, 'code' → enter it (completes IN the app so
  // installed home-screen apps don't get bounced into Safari).
  const [phase, setPhase] = useState<'email' | 'code'>('email');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const clean = email.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErrorMsg('Valid email required.');
      return;
    }
    setSubmitting(true);
    try {
      // redirect:false → send the email but stay here so we can take the code.
      // redirectTo → where the emailed magic link lands (for same-device use).
      await signIn('resend', {
        email: clean,
        redirect: false,
        redirectTo: '/pending',
      });
      setEmail(clean);
      setPhase('code');
    } catch {
      setErrorMsg('Could not send the code. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length < 6) {
      setErrorMsg('Enter the code from your email.');
      return;
    }
    setSubmitting(true);
    // Complete verification within THIS browsing context (the PWA), so the
    // session cookie lands in the app — not a separate Safari jar.
    const target =
      `/api/auth/callback/resend?callbackUrl=${encodeURIComponent('/pending')}` +
      `&token=${encodeURIComponent(clean)}&email=${encodeURIComponent(email)}`;
    window.location.href = target;
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: colors.bg,
        backgroundImage:
          'radial-gradient(ellipse at 50% 30%, rgba(255,42,42,0.10), transparent 55%), radial-gradient(ellipse at 50% 90%, rgba(255,42,42,0.05), transparent 60%)',
        color: colors.text,
        fontFamily: fonts.sans,
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="ug-glass" style={{ maxWidth: 460, width: '100%', padding: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: 999,
              background: colors.accent,
              boxShadow: '0 0 8px rgba(255,42,42,0.8)',
            }}
          />
          <span
            className="ug-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.4em',
              color: colors.accent,
              fontWeight: 700,
            }}
          >
            ∕∕ ACCESS RESTRICTED · SIGN IN
          </span>
        </div>

        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            margin: '0 0 12px',
            textAlign: 'center',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
          }}
        >
          Members <span style={{ color: colors.accent }}>only.</span>
        </h1>

        <p
          style={{
            fontSize: 14,
            color: colors.textMuted,
            textAlign: 'center',
            margin: '0 0 28px',
            lineHeight: 1.5,
          }}
        >
          {phase === 'email'
            ? "Enter your email. We'll send you a one-time code."
            : 'Enter the code we emailed you.'}
        </p>

        {phase === 'email' ? (
          <form onSubmit={handleSubmit}>
            <label className="ug-label" htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
              disabled={submitting}
              className="ug-input ug-input-lg"
            />
            <button
              type="submit"
              disabled={submitting}
              className="ug-btn ug-btn-primary ug-btn-block"
              style={{ marginTop: 16 }}
            >
              {submitting ? 'Sending…' : 'Send code →'}
            </button>
            {errorMsg && (
              <div className="ug-banner ug-banner-error" style={{ marginTop: 16 }}>
                {errorMsg}
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <div
              className="ug-banner ug-banner-success"
              style={{ textAlign: 'center', marginBottom: 16, fontSize: 13 }}
            >
              Code sent to <strong>{email}</strong> · check spam if needed
            </div>
            <label className="ug-label" htmlFor="signin-code">Sign-in code</label>
            <input
              id="signin-code"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXXX-XXXX"
              required
              autoFocus
              disabled={submitting}
              className="ug-input ug-input-lg"
              style={{
                textAlign: 'center',
                letterSpacing: '0.35em',
                fontFamily: fonts.mono,
                textTransform: 'uppercase',
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="ug-btn ug-btn-primary ug-btn-block"
              style={{ marginTop: 16 }}
            >
              {submitting ? 'Verifying…' : 'Sign in →'}
            </button>
            {errorMsg && (
              <div className="ug-banner ug-banner-error" style={{ marginTop: 16 }}>
                {errorMsg}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setPhase('email');
                setCode('');
                setErrorMsg(null);
              }}
              className="ug-btn ug-btn-text"
              style={{ width: '100%', marginTop: 8 }}
            >
              ← Use a different email
            </button>
            <p style={{ fontSize: 11, color: colors.textDim, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
              On your phone? Enter the code here rather than tapping the email
              link, so you stay signed in inside the app.
            </p>
          </form>
        )}

        <p
          className="ug-mono"
          style={{
            marginTop: 28,
            fontSize: 11,
            color: colors.textDim,
            textAlign: 'center',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <a
            href="/"
            style={{
              color: colors.textMuted,
              textDecoration: 'none',
            }}
          >
            ← BACK TO LANDING
          </a>
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div />}>
      <SignInForm />
    </Suspense>
  );
}
