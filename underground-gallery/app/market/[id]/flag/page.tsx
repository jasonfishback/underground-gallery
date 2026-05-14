// app/market/[id]/flag/page.tsx — report a listing.

'use client';

import { useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { flagListing } from '@/app/market/actions';
import { colors, fonts } from '@/lib/design';

const REASONS = [
  { value: 'spam', label: 'Spam or duplicate' },
  { value: 'fake', label: 'Fake or fraudulent' },
  { value: 'nsfw', label: 'NSFW or inappropriate' },
  { value: 'harassment', label: 'Harassment or abusive' },
  { value: 'other', label: 'Other' },
] as const;

export default function FlagListingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [reason, setReason] = useState<(typeof REASONS)[number]['value']>('spam');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await flagListing({ listingId: id, reason, details: details || null });
      if (!r.ok) setError(r.error);
      else setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <main
        style={{
          padding: '40px 24px',
          maxWidth: 540,
          margin: '0 auto',
          color: colors.text,
          fontFamily: fonts.sans,
        }}
      >
        <h1 style={{ fontSize: 24 }}>Thanks for the report</h1>
        <p style={{ color: colors.textMuted }}>
          We'll review the listing. Reports are confidential.
        </p>
        <button
          type="button"
          className="ug-btn ug-btn-primary"
          onClick={() => router.push(`/market/${id}`)}
        >
          Back to listing
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: '40px 24px',
        maxWidth: 540,
        margin: '0 auto',
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, fontFamily: fonts.mono, fontWeight: 700 }}>
        ∕∕ UNDERGROUND · REPORT
      </div>
      <h1 style={{ fontSize: 24, margin: '4px 0 16px' }}>Report this listing</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="ug-label">Reason</span>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as any)}
            className="ug-input"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="ug-label">Details (optional)</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            maxLength={500}
            className="ug-input"
            style={{ resize: 'vertical' }}
            placeholder="What about this seemed off?"
          />
        </label>
        {error && <div className="ug-banner ug-banner-error">{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={isPending} className="ug-btn ug-btn-primary">
            {isPending ? 'Sending…' : 'Submit report'}
          </button>
          <button type="button" className="ug-btn ug-btn-ghost" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
