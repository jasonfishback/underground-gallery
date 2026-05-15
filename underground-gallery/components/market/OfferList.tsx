// components/market/OfferList.tsx
//
// Seller view: list of pending/past offers with accept/decline actions.
// Buyer view: their own offers with withdraw.

'use client';

import { useTransition } from 'react';
import { respondToOffer, withdrawOffer } from '@/app/market/actions';
import { formatPrice } from '@/lib/market/types';
import { colors, fonts } from '@/lib/design';

type OfferRow = {
  id: string;
  amountCents: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  createdAt: Date;
  expiresAt: Date;
};

type SellerOffer = OfferRow & { buyerCallsign: string | null };
type BuyerOffer = OfferRow;

export function SellerOfferList({ offers }: { offers: SellerOffer[] }) {
  const [isPending, start] = useTransition();

  if (offers.length === 0) {
    return (
      <p style={{ fontSize: 13, color: colors.textMuted }}>
        No offers yet. They'll show up here as buyers send them.
      </p>
    );
  }

  return (
    <ul style={listStyle}>
      {offers.map((o) => (
        <li key={o.id} className="ug-card" style={itemStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
                {formatPrice(o.amountCents)}{' '}
                <span style={statusStyle(o.status)}>· {o.status}</span>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {o.buyerCallsign ?? 'A buyer'} · {new Date(o.createdAt).toLocaleDateString()}
              </div>
              {o.message && (
                <div
                  style={{
                    fontSize: 13,
                    marginTop: 6,
                    color: colors.text,
                    lineHeight: 1.5,
                  }}
                >
                  "{o.message}"
                </div>
              )}
            </div>
            {o.status === 'pending' && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <button
                  type="button"
                  className="ug-btn ug-btn-primary"
                  disabled={isPending}
                  onClick={() => start(async () => { await respondToOffer({ offerId: o.id, decision: 'accept' }); })}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="ug-btn ug-btn-ghost"
                  disabled={isPending}
                  onClick={() => start(async () => { await respondToOffer({ offerId: o.id, decision: 'decline' }); })}
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BuyerOfferList({ offers }: { offers: BuyerOffer[] }) {
  const [isPending, start] = useTransition();
  if (offers.length === 0) return null;
  return (
    <ul style={listStyle}>
      {offers.map((o) => (
        <li key={o.id} className="ug-card" style={itemStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {formatPrice(o.amountCents)}{' '}
                <span style={statusStyle(o.status)}>· {o.status}</span>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>
                Sent {new Date(o.createdAt).toLocaleDateString()}
              </div>
            </div>
            {o.status === 'pending' && (
              <button
                type="button"
                className="ug-btn ug-btn-ghost"
                disabled={isPending}
                onClick={() => start(async () => { await withdrawOffer(o.id); })}
              >
                Withdraw
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function statusStyle(s: OfferRow['status']): React.CSSProperties {
  const color =
    s === 'accepted' ? colors.success :
    s === 'declined' || s === 'withdrawn' || s === 'expired' ? colors.textDim :
    colors.warning; // pending
  return {
    fontSize: 11,
    letterSpacing: '0.18em',
    color,
    fontFamily: fonts.mono,
    fontWeight: 700,
    textTransform: 'uppercase',
  };
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const itemStyle: React.CSSProperties = {
  padding: 14,
};
