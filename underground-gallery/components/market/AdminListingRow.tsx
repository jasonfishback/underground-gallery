// components/market/AdminListingRow.tsx
//
// Compact listing row for the admin recent-activity panel.

'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adminRemoveListing, adminRestoreListing } from '@/app/admin/market/actions';
import { colors, fonts } from '@/lib/design';

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
      className="ug-card"
      style={{
        padding: '10px 14px',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/market/${id}`}
          style={{ fontSize: 14, fontWeight: 600, color: colors.text, textDecoration: 'none' }}
        >
          {title}
        </Link>
        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
          {listingType === 'car' ? 'Car' : 'Part'} · {priceLabel} · by{' '}
          {sellerCallsign ?? 'member'} ·{' '}
          <span style={statusStyle(status)}>{status.toUpperCase()}</span> ·{' '}
          {new Date(createdAt).toLocaleDateString()}
        </div>
      </div>
      {status !== 'removed' ? (
        <button
          type="button"
          className="ug-btn ug-btn-ghost"
          disabled={isPending}
          onClick={() => {
            if (confirm('Remove this listing?')) {
              run(() => adminRemoveListing(id));
            }
          }}
          style={{ color: colors.accent, borderColor: colors.accentBorder }}
        >
          Remove
        </button>
      ) : (
        <button
          type="button"
          className="ug-btn ug-btn-ghost"
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
    s === 'active' ? colors.success :
    s === 'sold' ? colors.accent :
    s === 'expired' || s === 'removed' ? colors.textDim :
    colors.warning;
  return { color, fontFamily: fonts.mono, fontWeight: 700 };
}
