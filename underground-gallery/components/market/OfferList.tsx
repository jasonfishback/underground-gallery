// components/market/OfferList.tsx
//
// Seller view: list of pending/past offers with accept/decline actions.
// Buyer view: their own offers with withdraw.

'use client';

import { useTransition } from 'react';
import { respondToOffer, withdrawOffer } from '@/app/market/actions';
import { formatPrice } from '@/lib/market/types';

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
      <p style={{ fontSize: 13, color: 'rgba(245,246,247,0.55)' }}>
        No offers yet. They'll show up here as buyers send them.
      </p>
    );
  }

  return (
    <ul style={listStyle}>
      {offers.map((o) => (
        <li key={o.id} style={itemStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {formatPrice(o.amountCents)}{' '}
                <span style={statusStyle(o.status)}>· {o.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(245,246,247,0.6)', marginTop: 2 }}>
                {o.buyerCallsign ?? 'A buyer'} · {new Date(o.createdAt).toLocaleDateString()}
              </div>
              {o.message && (
                <div
                  style={{
                    fontSize: 13,
                    marginTop: 6,
                    color: 'rgba(245,246,247,0.85)',
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
                  onClick={() => start(() => respondToOffer({ offerId: o.id, decision: 'accept' }))}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="ug-btn"
                  disabled={isPending}
                  onClick={() => start(() => respondToOffer({ offerId: o.id, decision: 'decline' }))}
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
        <li key={o.id} style={itemStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {formatPrice(o.amountCents)}{' '}
                <span style={statusStyle(o.status)}>· {o.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(245,246,247,0.55)' }}>
                Sent {new Date(o.createdAt).toLocaleDateString()}
              </div>
            </div>
            {o.status === 'pending' && (
              <button
                type="button"
                className="ug-btn"
                disabled={isPending}
                onClick={() => start(() => withdrawOffer(o.id))}
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
    s === 'accepted' ? '#7ee787' :
    s === 'declined' || s === 'withdrawn' || s === 'expired' ? '#888' :
    '#ff9'; // pending
  return {
    fontSize: 11,
    letterSpacing: '0.18em',
    color,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  background: 'rgba(20,22,30,0.4)',
};
