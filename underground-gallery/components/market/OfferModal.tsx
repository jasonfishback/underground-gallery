// components/market/OfferModal.tsx
//
// Buyer-side: "Make an offer" expandable panel.

'use client';

import { useState, useTransition } from 'react';
import { makeOffer } from '@/app/market/actions';
import { formatPrice } from '@/lib/market/types';

export function OfferModal({
  listingId,
  askingPriceCents,
  isOwner,
}: {
  listingId: string;
  askingPriceCents: number | null;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(
    askingPriceCents ? Math.round(askingPriceCents / 100 * 0.9) : 0,
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, start] = useTransition();

  if (isOwner) return null;
  if (!askingPriceCents) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = Math.round(amount * 100);
    if (cents <= 0) {
      setError('Enter an amount');
      return;
    }
    start(async () => {
      const r = await makeOffer({ listingId, amountCents: cents, message: message || null });
      if (!r.ok) setError(r.error);
      else {
        setSuccess(true);
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ug-btn"
        style={{ width: '100%', textAlign: 'center' }}
      >
        {success ? '✓ Offer sent — try again?' : 'Make an offer'}
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>YOUR OFFER (USD)</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: 'rgba(245,246,247,0.5)', marginTop: 2 }}>
          Asking: {formatPrice(askingPriceCents)} · Offer expires in 7 days.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>NOTE (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Pickup ready, can wire today, etc."
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={isPending} className="ug-btn ug-btn-primary">
          {isPending ? 'Sending…' : 'Send offer'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="ug-btn">
          Cancel
        </button>
        {error && <span style={{ fontSize: 12, color: '#ff5252', alignSelf: 'center' }}>{error}</span>}
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.22em',
  color: 'rgba(245,246,247,0.55)',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  background: '#0a0c12',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  width: '100%',
};
