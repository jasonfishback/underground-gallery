// components/SiteHeader.tsx

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
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: `0.5px solid ${colors.border}`,
        padding: '12px 16px',
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
        style={{
          fontSize: 11,
          letterSpacing: '0.3em',
          color: colors.accent,
          textDecoration: 'none',
          fontWeight: 700,
          fontFamily: fonts.mono,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        UNDERGROUND GALLERY
      </Link>

      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          overflowX: 'auto',
          flexWrap: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100%',
        }}
      >
        <NavLink href="/me">GARAGE</NavLink>
        <NavLink href="/race">RACE</NavLink>
        <NavLink href="/members">MEMBERS</NavLink>
        <Link
          href="/invites"
          style={{
            background: colors.accent,
            color: '#0a0a0a',
            padding: '6px 12px',
            fontFamily: fonts.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.25em',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            border: 'none',
          }}
        >
          + INVITE
        </Link>
        {ctx.isModerator && <NavLink href="/admin">ADMIN</NavLink>}
        <NotificationBell notifications={notifs} />
        <Link
          href="/profile"
          style={{
            color: colors.textMuted,
            textDecoration: 'none',
            fontFamily: fonts.mono,
            fontSize: 10,
            letterSpacing: '0.2em',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          PROFILE
        </Link>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 10,
        letterSpacing: '0.2em',
        color: colors.textMuted,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        textDecoration: 'none',
        fontFamily: fonts.mono,
        fontWeight: 700,
      }}
    >
      {children}
    </Link>
  );
}