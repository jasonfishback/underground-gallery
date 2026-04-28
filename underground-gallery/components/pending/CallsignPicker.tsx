'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCallsign, submitApplication } from '@/app/pending/actions';

type Props = {
  email: string;
  suggestion: string;
};

export function CallsignPicker({ email, suggestion }: Props) {
  const router = useRouter();
  const [callsign, setCallsign] = useState(suggestion);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  // Client-side quick validation
  function clientError(v: string): string | null {
    const t = v.trim();
    if (t.length === 0) return 'Pick a callsign.';
    if (t.length < 3) return 'Too short (3-20 characters).';
    if (t.length > 20) return 'Too long (3-20 characters).';
    if (!/^[a-zA-Z0-9_]+$/.test(t)) return 'Only letters, numbers, and underscores.';
    return null;
  }

  // Debounced server-side availability check
  useEffect(() => {
    const ce = clientError(callsign);
    if (ce) {
      setError(ce);
      setAvailable(false);
      setChecking(false);
      return;
    }
    setError(null);
    setAvailable(null);
    setChecking(true);
    const handle = setTimeout(async () => {
      const out = await checkCallsign(callsign);
      setChecking(false);
      if (out.ok) {
        setAvailable(true);
        setError(null);
      } else {
        setAvailable(false);
        setError(out.error || 'Unavailable.');
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [callsign]);

  function onSubmit() {
    if (available !== true) return;
    startTransition(async () => {
      const out = await submitApplication(callsign);
      if (!out.ok) {
        setError(out.error || 'Something went wrong.');
        setAvailable(false);
        return;
      }
      router.refresh();
    });
  }

  const canSubmit = available === true && !checking && !submitting;

  return (
    <div style={{ maxWidth: 480, width: '100%' }}>
      <div style={{ fontSize: 11, color: '#ff2a2a', letterSpacing: '0.4em', fontWeight: 700, marginBottom: 16, fontFamily: 'monospace' }}>
        STEP 1 · PICK YOUR CALLSIGN
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>
        What should we call you?
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(201,204,209,0.75)', lineHeight: 1.6, margin: '0 0 24px' }}>
        This is how other members will see you. 3-20 characters. Letters, numbers, underscores.
      </p>

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          type="text"
          value={callsign}
          onChange={(e) => setCallsign(e.target.value)}
          maxLength={30}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="your callsign"
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 20,
            fontFamily: 'monospace',
            color: '#f5f6f7',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${available === true ? '#2aff2a' : available === false ? '#ff2a2a' : 'rgba(255,255,255,0.18)'}`,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.2em', color: available === true ? '#2aff2a' : available === false ? '#ff2a2a' : 'rgba(201,204,209,0.5)' }}>
          {checking ? 'CHECKING...' : available === true ? '✓ AVAILABLE' : available === false ? 'NOT AVAILABLE' : ''}
        </div>
      </div>

      <div style={{ minHeight: 20, fontSize: 12, color: error ? '#ff2a2a' : 'rgba(201,204,209,0.6)', fontFamily: 'monospace', marginBottom: 24 }}>
        {error || (available === true ? 'Nice. Claim it.' : '')}
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '16px 32px',
          background: canSubmit ? '#ff2a2a' : 'rgba(255,255,255,0.08)',
          color: canSubmit ? '#0a0a0a' : 'rgba(201,204,209,0.3)',
          border: 'none',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.35em',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION →'}
      </button>

      <div style={{ fontSize: 11, color: 'rgba(201,204,209,0.5)', marginTop: 24, fontFamily: 'monospace' }}>
        SIGNED IN AS {email}
      </div>
    </div>
  );
}