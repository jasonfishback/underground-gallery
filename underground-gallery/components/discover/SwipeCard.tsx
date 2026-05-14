// components/discover/SwipeCard.tsx
//
// One swipable card. Native pointer events, CSS transforms — no extra deps.

'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import type { DiscoverCard } from '@/app/discover/page';

const SWIPE_THRESHOLD = 110; // px from center → commit
const ROTATE_AT_FULL_THROW = 18; // degrees of tilt at the threshold
const FLY_DURATION_MS = 280;

export function SwipeCard({
  card,
  interactive,
  onSwipe,
}: {
  card: DiscoverCard;
  interactive: boolean;
  onSwipe: (dir: 'left' | 'right') => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState<'left' | 'right' | null>(null);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);

  // Keyboard support on the top card
  useEffect(() => {
    if (!interactive) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') startFly('left');
      else if (e.key === 'ArrowRight') startFly('right');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interactive]);

  function onPointerDown(e: React.PointerEvent) {
    if (!interactive || flying) return;
    ref.current?.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!startRef.current || flying) return;
    const dx = e.clientX - startRef.current.x;
    setDragX(dx);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dt = Date.now() - startRef.current.t;
    const dyAbs = Math.abs(e.clientY - startRef.current.y);
    ref.current?.releasePointerCapture(e.pointerId);
    startRef.current = null;
    setDragging(false);

    // Tap (no real drag, low time): let Link handle navigation
    if (Math.abs(dx) < 6 && dyAbs < 6 && dt < 250) {
      setDragX(0);
      return;
    }

    if (dx > SWIPE_THRESHOLD) startFly('right');
    else if (dx < -SWIPE_THRESHOLD) startFly('left');
    else setDragX(0);
  }

  function startFly(dir: 'left' | 'right') {
    setFlying(dir);
    setDragX(dir === 'right' ? 800 : -800);
    setTimeout(() => onSwipe(dir), FLY_DURATION_MS);
  }

  const rotation = (dragX / SWIPE_THRESHOLD) * ROTATE_AT_FULL_THROW;
  const opacity = flying ? 0 : 1;
  const transform = `translateX(${dragX}px) rotate(${rotation}deg)`;
  const transition = dragging
    ? 'none'
    : flying
      ? `transform ${FLY_DURATION_MS}ms ease-out, opacity ${FLY_DURATION_MS}ms ease-out`
      : 'transform 220ms cubic-bezier(.2,.8,.2,1)';

  const intent = dragX > 40 ? 'save' : dragX < -40 ? 'pass' : null;

  const subtitle = [card.year, card.make, card.model, card.trim].filter(Boolean).join(' ');

  // The actual card body
  const body = (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 18,
        overflow: 'hidden',
        background: card.photoUrl
          ? `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%), #0a0c12 url(${card.photoUrl}) center / cover no-repeat`
          : 'linear-gradient(135deg, #1a1d28, #0f1119)',
        boxShadow:
          intent === 'save'
            ? '0 18px 50px rgba(255,42,42,0.35), 0 0 0 2px rgba(255,42,42,0.6)'
            : intent === 'pass'
              ? '0 18px 50px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.25)'
              : '0 14px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        transform,
        transition,
        opacity,
        cursor: interactive ? (dragging ? 'grabbing' : 'grab') : 'default',
        touchAction: 'pan-y',
        userSelect: 'none',
      }}
    >
      {/* Save/Pass intent watermark */}
      {intent && (
        <div
          style={{
            position: 'absolute',
            top: 26,
            left: intent === 'save' ? 'auto' : 26,
            right: intent === 'save' ? 26 : 'auto',
            padding: '8px 14px',
            border: `3px solid ${intent === 'save' ? '#ff3030' : '#fff'}`,
            color: intent === 'save' ? '#ff3030' : '#fff',
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '0.2em',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            borderRadius: 8,
            transform: intent === 'save' ? 'rotate(8deg)' : 'rotate(-8deg)',
            background: 'rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        >
          {intent === 'save' ? 'SAVE' : 'PASS'}
        </div>
      )}

      {/* Card content overlay */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '22px 22px 26px',
          color: '#fff',
        }}
      >
        {card.ownerCallsign && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              color: '#ff3030',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            @{card.ownerCallsign.toUpperCase()}
            {card.ownerRegion && (
              <span style={{ color: 'rgba(245,246,247,0.55)', marginLeft: 8 }}>
                · {card.ownerRegion}
              </span>
            )}
          </div>
        )}
        <h2
          style={{
            fontSize: 24,
            margin: 0,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          {card.name ?? subtitle}
        </h2>
        {card.name && (
          <div
            style={{
              fontSize: 14,
              color: 'rgba(245,246,247,0.85)',
              marginTop: 2,
            }}
          >
            {subtitle}
          </div>
        )}
        {card.notes && (
          <div
            style={{
              fontSize: 13,
              color: 'rgba(245,246,247,0.65)',
              marginTop: 10,
              lineHeight: 1.45,
              maxHeight: 50,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {card.notes}
          </div>
        )}
      </div>
    </div>
  );

  // Wrap in a Link only when interactive; deeper cards in the stack don't need to be tappable.
  if (interactive) {
    return (
      <Link
        href={`/v/${card.id}`}
        onClick={(e) => {
          // Suppress click if the user actually dragged
          if (Math.abs(dragX) > 6 || flying) e.preventDefault();
        }}
        style={{ display: 'block', position: 'absolute', inset: 0, textDecoration: 'none' }}
      >
        {body}
      </Link>
    );
  }
  return body;
}
