'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function SignInForm() {
  const params = useSearchParams();
  const errorParam = params?.get('error');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(errorParam ? 'Authentication failed. Try again.' : null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Valid email required.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn('resend', { email: email.trim().toLowerCase(), redirectTo: '/pending' });
    } catch {
      setErrorMsg('Could not send link. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#05060a', color: '#f5f6f7', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{ fontSize: 11, color: '#ff2a2a', letterSpacing: '0.4em', fontWeight: 700, marginBottom: 16, textAlign: 'center', fontFamily: 'monospace' }}>
          ACCESS RESTRICTED · SIGN IN
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 16px', textAlign: 'center' }}>
          Members <span style={{ color: '#ff2a2a' }}>only.</span>
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(201,204,209,0.7)', textAlign: 'center', margin: '0 0 36px' }}>
          Enter your email. We&apos;ll send a sign-in link.
        </p>
        <form onSubmit={handleSubmit}>
          <input
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
            style={{ width: '100%', padding: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', color: '#f5f6f7', fontSize: 16, marginBottom: 24, boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ width: '100%', padding: 16, background: '#ff2a2a', color: '#05060a', border: 'none', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: 11, cursor: 'pointer', opacity: submitting ? 0.5 : 1, fontFamily: 'monospace' }}
          >
            {submitting ? 'Sending...' : 'Send sign-in link'}
          </button>
          {errorMsg && (
            <div style={{ marginTop: 20, padding: 14, border: '1px solid #ff2a2a', background: 'rgba(255,42,42,0.08)', color: '#ff2a2a', fontSize: 12 }}>
              {errorMsg}
            </div>
          )}
        </form>
        <p style={{ marginTop: 32, fontSize: 12, color: 'rgba(201,204,209,0.5)', textAlign: 'center' }}>
          <a href="/" style={{ color: 'rgba(201,204,209,0.5)' }}>Back to landing</a>
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
