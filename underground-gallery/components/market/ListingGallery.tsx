// components/market/ListingGallery.tsx
//
// Photo gallery for the listing detail page.

'use client';

import { useState } from 'react';

type Photo = {
  id: string;
  urlFull: string;
  urlThumb: string;
};

export function ListingGallery({ photos, fallback }: { photos: Photo[]; fallback?: string | null }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div
        style={{
          aspectRatio: '4 / 3',
          background:
            fallback
              ? `#0a0c12 url(${fallback}) center / cover no-repeat`
              : 'linear-gradient(135deg, #1a1d28, #0f1119)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
    );
  }

  const current = photos[active] ?? photos[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          aspectRatio: '4 / 3',
          background: `#0a0c12 url(${current.urlFull}) center / contain no-repeat`,
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
      {photos.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              style={{
                flex: '0 0 auto',
                width: 84,
                height: 64,
                background: `#0a0c12 url(${p.urlThumb}) center / cover no-repeat`,
                border:
                  i === active
                    ? '2px solid #ff3030'
                    : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
