// components/market/AdminListingRow.tsx
//
// Compact listing row for the admin recent-activity panel.

'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminRemoveListing, adminRestoreListing } from '@/app/admin/market/actions';

export function AdminListingRow({
  id,
  title,
  status,
  listingType,
  priceLabel,
  sellerCallsign,
  createdAt,
}: {
  id: string;
  title: string;
  status: string;
  listingType: 'car' | 'part';
  priceLabel: string;
  sellerCallsign: string | null;
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
        padding: '10px 14px',
        background: 'rgba(20,22,30,0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/market/${id}`}
          style={{ fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none' }}
        >
          {title}
        </Link>
        <div style={{ fontSize: 11, color: 'rgba(245,246,247,0.55)', marginTop: 2 }}>
          {listingType === 'car' ? 'Car' : 'Part'} · {priceLabel} · by{' '}
          {sellerCallsign ?? 'member'} ·{' '}
          <span style={statusStyle(status)}>{status.toUpperCase()}</span> ·{' '}
          {new Date(createdAt).toLocaleDateString()}
        </div>
      </div>
      {status !== 'removed' ? (
        <button
          type="button"
          className="ug-btn"
          disabled={isPending}
          onClick={() => {
            if (confirm('Remove this listing?')) {
              run(() => adminRemoveListing(id));
            }
          }}
          style={{ color: '#ff5252', borderColor: 'rgba(255,82,82,0.3)' }}
        >
          Remove
        </button>
      ) : (
        <button
          type="button"
          className="ug-btn"
          disabled={isPending}
          onClick={() => run(() => adminRestoreListing(id))}
        >
          Restore
        </button>
      )}
    </li>
  );
}

function statusStyle(s: string): React.CSSProperties {
  const color =
    s === 'active' ? '#7ee787' :
    s === 'sold' ? '#ff5252' :
    s === 'expired' || s === 'removed' ? '#888' :
    '#ff9';
  return { color, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700 };
}
