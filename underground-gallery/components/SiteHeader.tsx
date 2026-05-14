// components/SiteHeader.tsx
//
// Sticky top nav. iOS-style frosted glass with subtle red accent line.
// Uses the design tokens from globals.css (.ug-glass / .ug-btn / pill styling).

import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/gates';
import { getRecentNotifications } from '@/lib/notifications/fetch';
import { NotificationBell } from '@/components/NotificationBell';

export async function SiteHeader() {
  const ctx = await getAuthContext();
  if (!ctx || ctx.status !== 'active') return null;

  const notifs = await getRecentNotifications(ctx.userId, 20);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background:
          'linear-gradient(180deg, rgba(10,12,18,0.85) 0%, rgba(10,12,18,0.65) 100%)',
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)',
        padding: '14px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <Link
        href="/me"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          letterSpacing: '0.22em',
          color: '#ffffff',
          textDecoration: 'none',
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: 999,
            background: '#ff2a2a',
            boxShadow: '0 0 8px rgba(255,42,42,0.8)',
          }}
        />
        UNDERGROUND<span style={{ color: '#ff2a2a', padding: '0 4px' }}>·</span>GALLERY
      </Link>

      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          overflowX: 'auto',
          flexWrap: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100%',
        }}
      >
        <NavLink href="/me">GARAGE</NavLink>
        <NavLink href="/discover">DISCOVER</NavLink>
        <NavLink href="/race">RACE</NavLink>
        <NavLink href="/market">MARKET</NavLink>
        <NavLink href="/members">MEMBERS</NavLink>
        <Link href="/invites" className="ug-btn ug-btn-primary ug-pill" style={{ marginLeft: 6 }}>
          + INVITE
        </Link>
        {ctx.isModerator && <NavLink href="/admin">ADMIN</NavLink>}
        <NotificationBell notifications={notifs} />
        <NavLink href="/profile">PROFILE</NavLink>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: '8px 12px',
        borderRadius: 999,
        fontSize: 10,
        letterSpacing: '0.22em',
        color: 'rgba(245,246,247,0.65)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        textDecoration: 'none',
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontWeight: 700,
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {children}
    </Link>
  );
}
