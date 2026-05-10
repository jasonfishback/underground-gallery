// components/market/ContactSheet.tsx
//
// "Message seller" inline form on the listing detail page. Uses the
// sendMessage server action.

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/app/market/actions';

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
        style={{
          padding: 14,
          fontSize: 13,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          color: 'rgba(245,246,247,0.65)',
        }}
      >
        This is your listing. <a href="/market/messages" style={{ color: '#ff5252' }}>View messages →</a>
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
        style={{
          background: '#0a0c12',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 14,
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="ug-btn ug-btn-primary"
        >
          {isPending ? 'Sending…' : 'Send message'}
        </button>
        {success && <span style={{ fontSize: 12, color: '#7ee787' }}>Sent.</span>}
        {error && <span style={{ fontSize: 12, color: '#ff5252' }}>{error}</span>}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(245,246,247,0.45)' }}>
        Stay in-app — links and phone numbers in messages are flagged for review.
      </div>
    </form>
  );
}
