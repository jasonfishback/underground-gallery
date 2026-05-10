// components/market/AdminFlagRow.tsx
//
// Single pending-report row in the admin queue with action buttons.

'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resolveFlag, adminRemoveListing } from '@/app/admin/market/actions';

type Listing = {
  id: string;
  title: string;
  status: string;
  listingType: 'car' | 'part';
  sellerCallsign: string | null;
};

export function AdminFlagRow({
  flagId,
  listingId,
  listing,
  reason,
  details,
  reporterCallsign,
  createdAt,
}: {
  flagId: string;
  listingId: string;
  listing: Listing | null;
  reason: string;
  details: string | null;
  reporterCallsign: string | null;
  createdAt: Date;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    start(async () => {
      const r = await fn();
      if (!r.ok) alert(r.error ?? 'Action failed');
      else router.refresh();
    });
  }

  return (
    <li
      style={{
        padding: 14,
        background: 'rgba(20,22,30,0.55)',
        border: '1px solid rgba(255,42,42,0.25)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: '#ff5252',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontWeight: 700,
            }}
          >
            {reason.toUpperCase()}
          </div>
          {listing ? (
            <Link
              href={`/market/${listing.id}`}
              style={{ fontSize: 16, fontWeight: 600, color: '#fff', textDecoration: 'none' }}
            >
              {listing.title}
            </Link>
          ) : (
            <div style={{ fontSize: 14, color: 'rgba(245,246,247,0.6)' }}>
              Listing {listingId} (deleted?)
            </div>
          )}
          <div style={{ fontSize: 12, color: 'rgba(245,246,247,0.6)', marginTop: 2 }}>
            By {listing?.sellerCallsign ?? '?'} · Reported by {reporterCallsign ?? 'someone'} ·{' '}
            {new Date(createdAt).toLocaleDateString()}
          </div>
          {details && (
            <p style={{ fontSize: 13, color: 'rgba(245,246,247,0.85)', marginTop: 6, lineHeight: 1.5 }}>
              "{details}"
            </p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          className="ug-btn ug-btn-primary"
          disabled={isPending}
          onClick={() =>
            run(async () => {
              const a = await adminRemoveListing(listingId);
              if (!a.ok) return a;
              return resolveFlag(flagId, 'resolved', 'Listing removed');
            })
          }
        >
          Remove listing
        </button>
        <button
          type="button"
          className="ug-btn"
          disabled={isPending}
          onClick={() => run(() => resolveFlag(flagId, 'dismissed', 'No action'))}
        >
          Dismiss report
        </button>
        {listing && (
          <Link href={`/market/${listing.id}`} className="ug-btn">
            View listing
          </Link>
        )}
      </div>
    </li>
  );
}
