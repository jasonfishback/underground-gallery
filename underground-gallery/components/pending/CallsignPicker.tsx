'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { checkCallsign, submitApplication } from '@/app/pending/actions';
import { colors, fonts } from '@/lib/design';

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
  const statusColor =
    available === true ? colors.success : available === false ? colors.accent : colors.textDim;
  const inputBorderColor =
    available === true ? colors.success : available === false ? colors.accent : colors.border;

  return (
    <div className="ug-card" style={{ maxWidth: 480, width: '100%', padding: 32 }}>
      <div className="ug-mono" style={{ fontSize: 11, color: colors.accent, letterSpacing: '0.4em', fontWeight: 700, marginBottom: 16 }}>
        ∕∕ STEP 1 · PICK YOUR CALLSIGN
      </div>
      <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
        What should we call you?
      </h1>
      <p style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.6, margin: '0 0 24px' }}>
        This is how other members will see you. 3-20 characters. Letters, numbers, underscores.
      </p>

      <label className="ug-label" htmlFor="callsign-input">Callsign</label>
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          id="callsign-input"
          type="text"
          value={callsign}
          onChange={(e) => setCallsign(e.target.value)}
          maxLength={30}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="your callsign"
          className="ug-input"
          style={{
            fontFamily: fonts.mono,
            fontSize: 20,
            borderColor: inputBorderColor,
            paddingRight: 140,
          }}
        />
        <div
          className="ug-mono"
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: statusColor,
            pointerEvents: 'none',
          }}
        >
          {checking ? 'CHECKING...' : available === true ? '✓ AVAILABLE' : available === false ? 'NOT AVAILABLE' : ''}
        </div>
      </div>

      <div
        className="ug-mono"
        style={{
          minHeight: 20,
          fontSize: 12,
          color: error ? colors.accent : colors.textMuted,
          marginBottom: 24,
        }}
      >
        {error || (available === true ? 'Nice. Claim it.' : '')}
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="ug-btn ug-btn-primary ug-btn-block"
      >
        {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION →'}
      </button>

      <div className="ug-mono" style={{ fontSize: 11, color: colors.textDim, marginTop: 24, letterSpacing: '0.1em' }}>
        SIGNED IN AS {email}
      </div>
    </div>
  );
}
