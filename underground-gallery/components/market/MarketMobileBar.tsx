// components/market/MarketMobileBar.tsx
//
// Fixed bottom action bar for listing detail pages, mobile-only.
// Shows price + Contact + Save so the buyer never has to scroll back up.

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { sendMessage, toggleWatch } from '@/app/market/actions';
import { formatPriceWithType } from '@/lib/market/types';

type Props = {
  listingId: string;
  sellerId: string;
  sellerCallsign: string | null;
  priceCents: number | null;
  priceType: 'firm' | 'obo' | 'trade' | 'free';
  currency: string;
  status: string;
  isOwner: boolean;
  initialWatching: boolean;
  signedIn: boolean;
};

export function MarketMobileBar({
  listingId,
  sellerId,
  sellerCallsign,
  priceCents,
  priceType,
  currency,
  status,
  isOwner,
  initialWatching,
  signedIn,
}: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [sending, startSend] = useTransition();
  const [watching, setWatching] = useState(initialWatching);
  const [watchPending, startWatch] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onContact() {
    if (!signedIn) {
      window.location.href = '/auth/signin';
      return;
    }
    setOpen(true);
  }

  function onSave() {
    if (!signedIn) {
      window.location.href = '/auth/signin';
      return;
    }
    startWatch(async () => {
      const optimistic = !watching;
      setWatching(optimistic);
      const res = await toggleWatch(listingId);
      if (!(res as any)?.ok) setWatching(!optimistic);
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = body.trim();
    if (trimmed.length === 0) return;
    startSend(async () => {
      const res = (await sendMessage({
        listingId,
        toUserId: sellerId,
        body: trimmed,
      })) as { ok: boolean; error?: string };
      if (!res.ok) {
        setError(res.error ?? 'Could not send message.');
        return;
      }
      setOpen(false);
      setBody('');
      window.location.href = `/market/messages/${listingId}-${sellerId}`;
    });
  }

  // Owners and inactive listings don't show the bar (they have edit/offer
  // surfaces elsewhere; no buyer-actions apply).
  if (isOwner || status !== 'active') return null;

  const priceLabel = formatPriceWithType(priceCents, priceType, currency);

  return (
    <>
      <div className="ug-market-mobile-bar">
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(245,246,247,0.5)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            ASKING
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#ff3030', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {priceLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={watchPending}
          aria-label={watching ? 'Saved' : 'Save'}
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.15)',
            background: watching ? 'rgba(255,42,42,0.18)' : 'rgba(255,255,255,0.05)',
            color: watching ? '#ff3030' : '#fff',
            cursor: 'pointer',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {watching ? '♥' : '♡'}
        </button>
        <button
          type="button"
          onClick={onContact}
          className="ug-btn ug-btn-primary"
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          MESSAGE
        </button>
      </div>

      {open && (
        <div
          onClick={() => !sending && setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 14,
          }}
        >
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 540,
              background: 'linear-gradient(180deg, rgba(24,26,34,0.98), rgba(14,16,22,0.98))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: '0.28em', color: 'rgba(245,246,247,0.6)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
              MESSAGE {sellerCallsign ? `@${sellerCallsign.toUpperCase()}` : 'THE SELLER'}
            </div>
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Still available? What's your best out-the-door price?"
              rows={4}
              maxLength={1200}
              style={{
                width: '100%',
                resize: 'vertical',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                padding: 12,
                fontFamily: 'inherit',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: '#ff7070' }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="ug-btn"
                style={{ padding: '10px 16px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || body.trim().length === 0}
                className="ug-btn ug-btn-primary"
                style={{ padding: '10px 18px' }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
