'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { colors, fonts } from '@/lib/design';

function SignInForm() {
  const params = useSearchParams();
  const errorParam = params?.get('error');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    errorParam ? 'Authentication failed. Try again.' : null,
  );
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Valid email required.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn('resend', {
        email: email.trim().toLowerCase(),
        redirectTo: '/pending',
      });
      setSentTo(email.trim().toLowerCase());
    } catch {
      setErrorMsg('Could not send link. Try again.');
      setSubmitting(false);
    }
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
          Enter your email. We&apos;ll send you a one-time sign-in link.
        </p>

        {sentTo ? (
          <div className="ug-banner ug-banner-success" style={{ textAlign: 'center' }}>
            Check <strong>{sentTo}</strong> for the sign-in link.
            <br />
            <span style={{ fontSize: 11, opacity: 0.8 }}>
              Link expires in 24 hours · check spam if you don&apos;t see it
            </span>
          </div>
        ) : (
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
              {submitting ? 'Sending…' : 'Send sign-in link →'}
            </button>
            {errorMsg && (
              <div className="ug-banner ug-banner-error" style={{ marginTop: 16 }}>
                {errorMsg}
              </div>
            )}
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
