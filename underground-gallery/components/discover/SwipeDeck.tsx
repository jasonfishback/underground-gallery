// components/discover/SwipeDeck.tsx
//
// Stack of car-build cards. Pop one off the top each time the user swipes
// right (save) or left (pass). v1: saves are localStorage-only. We can wire
// to the DB later by mapping to a `vehicle_likes` table.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DiscoverCard } from '@/app/discover/page';
import { SwipeCard } from './SwipeCard';

const SAVED_KEY = 'ug-discover-saved';

export function SwipeDeck({ cards }: { cards: DiscoverCard[] }) {
  const [stack, setStack] = useState<DiscoverCard[]>(cards);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [lastAction, setLastAction] = useState<'pass' | 'save' | null>(null);

  // Load saves from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSavedIds(JSON.parse(raw));
    } catch {}
  }, []);

  function persistSaved(ids: string[]) {
    setSavedIds(ids);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
    } catch {}
  }

  function pop(action: 'pass' | 'save') {
    setStack((s) => {
      const next = s.slice(0, -1);
      return next;
    });
    setLastAction(action);
    if (action === 'save') {
      const top = stack[stack.length - 1];
      if (top && !savedIds.includes(top.id)) persistSaved([...savedIds, top.id]);
    }
    // Clear the toast after a moment
    setTimeout(() => setLastAction(null), 900);
  }

  if (stack.length === 0) {
    return (
      <div
        style={{
          marginTop: 16,
          padding: '64px 24px',
          textAlign: 'center',
          background: 'rgba(20,22,30,0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
        }}
      >
        <div style={{ fontSize: 38, marginBottom: 8 }}>🏁</div>
        <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>You&apos;ve seen them all.</h2>
        <p style={{ fontSize: 13, color: 'rgba(245,246,247,0.6)', marginTop: 6 }}>
          {savedIds.length > 0
            ? `${savedIds.length} build${savedIds.length === 1 ? '' : 's'} saved.`
            : 'Come back tomorrow for fresh builds.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
          <Link href="/members" className="ug-btn">
            Roster view
          </Link>
          <Link href="/market" className="ug-btn ug-btn-primary">
            Browse market
          </Link>
        </div>
      </div>
    );
  }

  // Render the top 3 cards; the rest stay in memory but aren't painted.
  const visible = stack.slice(-3);
  const top = visible[visible.length - 1];

  return (
    <div style={{ position: 'relative' }}>
      {/* Stack area — fixed aspect so cards under the top one peek out */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 4.2',
          marginTop: 8,
        }}
      >
        {visible.map((c, i) => {
          const depth = visible.length - 1 - i; // 0 = top
          const scale = 1 - depth * 0.04;
          const translateY = depth * 10;
          return (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateY(${translateY}px) scale(${scale})`,
                transformOrigin: 'top center',
                zIndex: 10 - depth,
                pointerEvents: depth === 0 ? 'auto' : 'none',
              }}
            >
              <SwipeCard
                card={c}
                interactive={depth === 0}
                onSwipe={(dir) => pop(dir === 'right' ? 'save' : 'pass')}
              />
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          marginTop: 18,
        }}
      >
        <button
          type="button"
          onClick={() => pop('pass')}
          aria-label="Pass"
          style={{
            ...actionBtnStyle,
            color: '#fff',
            background: 'rgba(20,22,30,0.7)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          ✕ PASS
        </button>
        <Link
          href={top ? `/v/${top.id}` : '#'}
          aria-label="Open detail"
          style={{
            ...actionBtnStyle,
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.12)',
            textDecoration: 'none',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          OPEN
        </Link>
        <button
          type="button"
          onClick={() => pop('save')}
          aria-label="Save"
          style={{
            ...actionBtnStyle,
            color: '#fff',
            background: 'linear-gradient(135deg, #ff3030, #b80000)',
            border: '1px solid rgba(255,48,48,0.4)',
            boxShadow: '0 6px 22px rgba(255,42,42,0.25)',
          }}
        >
          ♥ SAVE
        </button>
      </div>

      {/* Counter */}
      <div
        style={{
          marginTop: 14,
          fontSize: 10,
          letterSpacing: '0.22em',
          color: 'rgba(245,246,247,0.4)',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          textAlign: 'center',
        }}
      >
        {stack.length} REMAINING · {savedIds.length} SAVED
      </div>

      {/* Action toast */}
      {lastAction && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: lastAction === 'save'
              ? 'linear-gradient(135deg, #ff3030, #b80000)'
              : 'rgba(20,22,30,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            letterSpacing: '0.2em',
            fontWeight: 700,
            zIndex: 100,
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        >
          {lastAction === 'save' ? '♥ SAVED' : '✕ PASSED'}
        </div>
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: '14px 0',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  letterSpacing: '0.2em',
  cursor: 'pointer',
};
