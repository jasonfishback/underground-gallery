// components/SiteHeader.tsx
//
// Sticky top nav. iOS-style frosted glass with subtle red accent line.
// Uses the design tokens from globals.css (.ug-glass / .ug-btn / pill styling).

import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/gates';
import { getRecentNotifications } from '@/lib/notifications/fetch';
import { NotificationBell } from '@/components/NotificationBell';
import { colors, fonts } from '@/lib/design';

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
        borderBottom: `1px solid ${colors.border}`,
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)',
        padding: '14px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontFamily: fonts.sans,
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      <Link
        href="/me"
        className="ug-mono"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          letterSpacing: '0.22em',
          color: colors.text,
          textDecoration: 'none',
          fontWeight: 700,
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
            background: colors.accent,
            boxShadow: '0 0 8px rgba(255,42,42,0.8)',
          }}
        />
        UNDERGROUND
        <span style={{ color: colors.accent, padding: '0 4px' }}>·</span>
        GALLERY
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
        <NavLink href="/race">RACE</NavLink>
        <NavLink href="/market">MARKET</NavLink>
        <NavLink href="/members">MEMBERS</NavLink>
        <Link
          href="/invites"
          className="ug-btn ug-btn-primary ug-pill"
          style={{ marginLeft: 6 }}
        >
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
      className="ug-pill ug-mono"
      style={{
        fontSize: 10,
        letterSpacing: '0.22em',
        color: colors.textMuted,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        textDecoration: 'none',
        fontWeight: 700,
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {children}
    </Link>
  );
}
