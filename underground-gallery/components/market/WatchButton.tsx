// components/market/WatchButton.tsx
//
// Toggleable watchlist button. Optimistic update.

'use client';

import { useState, useTransition } from 'react';
import { toggleWatch } from '@/app/market/actions';

export function WatchButton({
  listingId,
  initialWatching,
}: {
  listingId: string;
  initialWatching: boolean;
}) {
  const [watching, setWatching] = useState(initialWatching);
  const [isPending, start] = useTransition();

  function onClick() {
    const optimistic = !watching;
    setWatching(optimistic);
    start(async () => {
      const r = await toggleWatch(listingId);
      if (!r.ok) setWatching(!optimistic);
      else setWatching(r.data?.watching ?? optimistic);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="ug-btn"
      style={{
        background: watching ? 'rgba(255,42,42,0.18)' : 'rgba(255,255,255,0.04)',
        borderColor: watching ? 'rgba(255,42,42,0.45)' : 'rgba(255,255,255,0.12)',
        color: watching ? '#ff5252' : 'rgba(245,246,247,0.85)',
      }}
    >
      {watching ? '★ Saved' : '☆ Save'}
    </button>
  );
}
