// components/market/ListingLifecyclePanel.tsx
//
// Sticky right-rail panel on the edit page. Publish / mark sold / bump / remove.

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  publishDraft,
  markSold,
  bumpListing,
  removeListing,
} from '@/app/market/actions';

type Status = 'draft' | 'active' | 'sold' | 'expired' | 'removed';

export function ListingLifecyclePanel({
  listingId,
  status,
  publishedAt,
  expiresAt,
}: {
  listingId: string;
  status: Status;
  publishedAt: Date | null;
  expiresAt: Date | null;
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
    <aside
      style={{
        position: 'sticky',
        top: 84,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 18,
        background: 'rgba(20,22,30,0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
      }}
    >
      <div>
        <div style={accentLabelStyle}>STATUS</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 4 }}>
          {status.toUpperCase()}
        </div>
      </div>
      {publishedAt && (
        <div style={metaStyle}>
          Published: {new Date(publishedAt).toLocaleDateString()}
        </div>
      )}
      {expiresAt && status === 'active' && (
        <div style={metaStyle}>
          Expires: {new Date(expiresAt).toLocaleDateString()}
        </div>
      )}

      {status === 'draft' && (
        <button
          type="button"
          className="ug-btn ug-btn-primary"
          disabled={isPending}
          onClick={() => run(() => publishDraft(listingId))}
        >
          Publish (30 days)
        </button>
      )}

      {status === 'active' && (
        <>
          <button
            type="button"
            className="ug-btn"
            disabled={isPending}
            onClick={() => run(() => bumpListing(listingId))}
          >
            Bump (+30 days)
          </button>
          <button
            type="button"
            className="ug-btn"
            disabled={isPending}
            onClick={() => {
              if (confirm('Mark as sold? Watchers will be notified.')) {
                run(() => markSold(listingId));
              }
            }}
          >
            Mark sold
          </button>
        </>
      )}

      {(status === 'expired') && (
        <button
          type="button"
          className="ug-btn ug-btn-primary"
          disabled={isPending}
          onClick={() => run(() => bumpListing(listingId))}
        >
          Re-publish (30 days)
        </button>
      )}

      {status !== 'removed' && (
        <button
          type="button"
          className="ug-btn"
          disabled={isPending}
          onClick={() => {
            if (confirm('Remove this listing? It will be hidden from members.')) {
              run(() => removeListing(listingId));
            }
          }}
          style={{ color: '#ff5252', borderColor: 'rgba(255,82,82,0.3)' }}
        >
          Remove listing
        </button>
      )}
    </aside>
  );
}

const accentLabelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.3em',
  color: 'rgba(255,42,42,0.85)',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontWeight: 700,
};

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(245,246,247,0.55)',
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  letterSpacing: '0.05em',
};
