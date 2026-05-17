// components/market/OfferModal.tsx
//
// Buyer-side: "Make an offer" expandable modal.

'use client';

import { useState, useTransition } from 'react';
import { makeOffer } from '@/app/market/actions';
import { formatPrice } from '@/lib/market/types';
import { colors } from '@/lib/design';

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ug-btn ug-btn-ghost ug-btn-block"
      >
        {success ? '✓ Offer sent — try again?' : 'Make an offer'}
      </button>

      {open && (
        <div
          className="ug-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="ug-modal" role="dialog" aria-label="Make an offer">
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text }}>
                  Make an offer
                </h2>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                  Asking: {formatPrice(askingPriceCents)} · Offer expires in 7 days.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="ug-label" htmlFor="offer-amount">Your offer (USD)</label>
                <input
                  id="offer-amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="ug-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="ug-label" htmlFor="offer-note">Note (optional)</label>
                <textarea
                  id="offer-note"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Pickup ready, can wire today, etc."
                  className="ug-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {error && <div className="ug-banner ug-banner-error">{error}</div>}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="submit" disabled={isPending} className="ug-btn ug-btn-primary">
                  {isPending ? 'Sending…' : 'Send offer'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="ug-btn ug-btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
