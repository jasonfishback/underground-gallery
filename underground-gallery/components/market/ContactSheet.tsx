// components/market/ContactSheet.tsx
//
// "Message seller" inline form on the listing detail page. Uses the
// sendMessage server action.

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/app/market/actions';
import { colors } from '@/lib/design';

export function ContactSheet({
  listingId,
  sellerId,
  sellerCallsign,
  isOwner,
}: {
  listingId: string;
  sellerId: string;
  sellerCallsign: string | null;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, start] = useTransition();

  if (isOwner) {
    return (
      <div
        className="ug-card"
        style={{
          padding: 14,
          fontSize: 13,
          color: colors.textMuted,
        }}
      >
        This is your listing. <a href="/market/messages" style={{ color: colors.accent }}>View messages →</a>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return;
    start(async () => {
      const r = await sendMessage({ listingId, toUserId: sellerId, body });
      if (!r.ok) setError(r.error);
      else {
        setSuccess(true);
        setBody('');
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={`Message ${sellerCallsign ?? 'the seller'}…`}
        rows={4}
        maxLength={2000}
        className="ug-input"
        style={{ resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="ug-btn ug-btn-primary"
        >
          {isPending ? 'Sending…' : 'Send message'}
        </button>
        {success && <span style={{ fontSize: 12, color: colors.success }}>Sent.</span>}
        {error && <span style={{ fontSize: 12, color: colors.danger }}>{error}</span>}
      </div>
      <div style={{ fontSize: 11, color: colors.textDim }}>
        Stay in-app — links and phone numbers in messages are flagged for review.
      </div>
    </form>
  );
}
