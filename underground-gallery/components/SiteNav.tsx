'use client';

// components/SiteNav.tsx
//
// Client nav pieces used by the server SiteHeader:
//   <DesktopNav>   — pill row with active-route highlighting (hidden < 720px)
//   <MobileTabBar> — fixed bottom tab bar, app-style (hidden ≥ 720px)
// Both use usePathname for aria-current + the red active treatment.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors } from '@/lib/design';

type Item = { href: string; label: string; match: (path: string) => boolean };

const CORE_ITEMS: Item[] = [
  {
    href: '/me',
    label: 'GARAGE',
    match: (p) => p === '/me' || p.startsWith('/v/') || p === '/garage',
  },
  { href: '/discover', label: 'DISCOVER', match: (p) => p.startsWith('/discover') },
  { href: '/race', label: 'RACE', match: (p) => p.startsWith('/race') },
  { href: '/market', label: 'MARKET', match: (p) => p.startsWith('/market') },
  { href: '/members', label: 'MEMBERS', match: (p) => p.startsWith('/members') || p.startsWith('/u/') },
];

export function DesktopNav({ isModerator }: { isModerator: boolean }) {
  const pathname = usePathname() ?? '';

  return (
    <nav
      className="ug-nav-desktop"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'nowrap',
      }}
    >
      {CORE_ITEMS.map((item) => (
        <NavPill key={item.href} item={item} active={item.match(pathname)} />
      ))}
      <Link
        href="/invites"
        className="ug-btn ug-btn-primary ug-pill"
        style={{ marginLeft: 6 }}
      >
        + INVITE
      </Link>
      {isModerator && (
        <NavPill
          item={{ href: '/admin', label: 'ADMIN', match: (p) => p.startsWith('/admin') }}
          active={pathname.startsWith('/admin')}
        />
      )}
      <NavPill
        item={{ href: '/profile', label: 'PROFILE', match: (p) => p.startsWith('/profile') }}
        active={pathname.startsWith('/profile')}
      />
    </nav>
  );
}

function NavPill({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className="ug-pill ug-mono"
      style={{
        fontSize: 10,
        letterSpacing: '0.22em',
        color: active ? colors.text : colors.textMuted,
        background: active ? 'rgba(255,42,42,0.12)' : 'transparent',
        border: active
          ? '1px solid rgba(255,80,80,0.35)'
          : '1px solid transparent',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        textDecoration: 'none',
        fontWeight: 700,
        transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {item.label}
    </Link>
  );
}

export function MobileTabBar() {
  const pathname = usePathname() ?? '';
  const items: Item[] = [
    ...CORE_ITEMS,
    { href: '/profile', label: 'PROFILE', match: (p) => p.startsWith('/profile') },
  ];

  return (
    <nav className="ug-tabbar" aria-label="Primary">
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="ug-mono"
            style={{
              flex: 1,
              minHeight: 58,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '12px 2px',
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textDecoration: 'none',
              color: active ? colors.text : colors.textDim,
              background: active ? 'rgba(255,42,42,0.08)' : 'transparent',
              transition: 'color 0.15s ease, background 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: 999,
                background: active ? colors.accent : 'rgba(255,255,255,0.16)',
                boxShadow: active ? '0 0 8px rgba(255,42,42,0.8)' : 'none',
                transition: 'background 0.15s ease, box-shadow 0.15s ease',
              }}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
