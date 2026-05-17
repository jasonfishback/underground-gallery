// components/landing/BootIntro.tsx
//
// Cinematic boot-up overlay restored from the original public/landing.html.
// Plays once per browser session (sessionStorage flag), then unmounts and
// reveals whatever's underneath. Tap anywhere to skip. Hidden entirely if
// the user prefers reduced motion.

'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ug-boot-seen';
const BOOT_DURATION_MS = 4600; // matches the 4.5s CSS animation + a hair

export function BootIntro() {
  // Default true so the very first paint includes the overlay — avoids a
  // flash where the landing content is briefly visible before the boot.
  const [show, setShow] = useState(true);
  const [unmount, setUnmount] = useState(false);

  useEffect(() => {
    // Reduced motion: never play
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setShow(false);
      setUnmount(true);
      return;
    }

    // Once-per-session: if already seen this session, skip
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        setShow(false);
        setUnmount(true);
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore (private mode etc.) — still play
    }

    // Auto-dismiss after the animation completes
    const timer = setTimeout(() => {
      setShow(false);
      // Wait for the fade-out then unmount entirely so it doesn't sit in DOM
      setTimeout(() => setUnmount(true), 250);
    }, BOOT_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  function skip() {
    setShow(false);
    setTimeout(() => setUnmount(true), 200);
  }

  if (unmount) return null;

  return (
    <div
      id="ug-boot"
      onClick={skip}
      style={{
        opacity: show ? undefined : 0,
        transition: show ? undefined : 'opacity 200ms ease-out',
      }}
      aria-hidden
    >
      <div className="ug-boot-glitch" />
      <div className="ug-boot-inner">
        <svg className="ug-boot-logo" width={120} height={120} viewBox="0 0 40 40" fill="none">
          <rect x={3} y={3} width={34} height={34} stroke="#ff2a2a" strokeWidth={1.5} fill="none" strokeOpacity={0.4} />
          <path d="M3 3 L7 3 M37 3 L33 3 M3 37 L7 37 M37 37 L33 37" stroke="#ff2a2a" strokeWidth={2} strokeLinecap="square" />
          <path d="M8 8 L8 32 L32 32 L32 8" stroke="#ff2a2a" strokeWidth={3} strokeLinecap="square" strokeLinejoin="miter" fill="none" />
          <path d="M25 15 L15 15 L15 27 L25 27 L25 22 L20 22" stroke="#ff2a2a" strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" fill="none" />
        </svg>
        <div className="ug-boot-wordmark">
          UNDERGROUND
          <span style={{ color: '#ff2a2a', fontWeight: 900, padding: '0 6px' }}>··</span>
          GALLERY
        </div>
        <div className="ug-boot-line">
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#ff2a2a',
              boxShadow: '0 0 8px #ff2a2a',
              animation: 'ugBlink 1.6s infinite',
              display: 'inline-block',
            }}
          />
          <span>ACCESS RESTRICTED</span>
        </div>
      </div>
    </div>
  );
}
