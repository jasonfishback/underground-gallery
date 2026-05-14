// components/market/ListingGallery.tsx
//
// Cars-and-Bids style gallery: cinematic 16:10 hero, photo counter overlay,
// thumbnail strip, keyboard arrow nav.

'use client';

import { useEffect, useState } from 'react';

type Photo = {
  id: string;
  urlFull: string;
  urlThumb: string;
};

export function ListingGallery({ photos, fallback }: { photos: Photo[]; fallback?: string | null }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') setActive((i) => (i - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setActive((i) => (i + 1) % photos.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div
        style={{
          aspectRatio: '16 / 10',
          background: fallback
            ? `#0a0c12 url(${fallback}) center / cover no-repeat`
            : 'linear-gradient(135deg, #1a1d28, #0f1119)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
    );
  }

  const current = photos[active] ?? photos[0];
  const next = () => setActive((i) => (i + 1) % photos.length);
  const prev = () => setActive((i) => (i - 1 + photos.length) % photos.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 10',
          background: `#0a0c12 url(${current.urlFull}) center / cover no-repeat`,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              style={navBtnStyle('left')}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              style={navBtnStyle('right')}
            >
              ›
            </button>
            <div style={counterStyle}>
              {active + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
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
                width: 110,
                height: 70,
                background: `#0a0c12 url(${p.urlThumb}) center / cover no-repeat`,
                border:
                  i === active
                    ? '2px solid #ff3030'
                    : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                cursor: 'pointer',
                padding: 0,
                opacity: i === active ? 1 : 0.7,
                transition: 'opacity 120ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 16,
    transform: 'translateY(-50%)',
    width: 44,
    height: 44,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    fontSize: 26,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  };
}

const counterStyle: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 14,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  color: '#fff',
  fontSize: 11,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  letterSpacing: '0.18em',
  padding: '6px 10px',
  borderRadius: 999,
  fontWeight: 600,
};
