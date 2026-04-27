// components/SiteHeader.tsx
//
// Shared header rendered on every authenticated page via app/layout.tsx.
// Server component — fetches the user's recent notifications and renders
// the notification bell. If the user isn't logged in, this renders nothing
// (the gated landing page handles its own header).

import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/gates';
import { getRecentNotifications } from '@/lib/notifications/fetch';
import { NotificationBell } from '@/components/NotificationBell';
import { colors, fonts } from '@/lib/design';

export async function SiteHeader() {
  const ctx = await getAuthContext();
  // Not logged in or pending — let individual pages handle their own header
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
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: fonts.sans,
      }}
    >
      <Link
        href="/me"
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: colors.accent,
          textDecoration: 'none',
          fontWeight: 700,
          fontFamily: fonts.mono,
        }}
      >
        UNDERGROUND GALLERY
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <NavLink href="/me">GARAGE</NavLink>
        <NavLink href="/race">RACE</NavLink>
        <NavLink href="/members">MEMBERS</NavLink>
        <NavLink href="/invites">INVITES</NavLink>
        {ctx.isModerator && <NavLink href="/admin">ADMIN</NavLink>}
        <NotificationBell notifications={notifs} />
        <Link href="/profile" style={{ color: 'inherit', textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>PROFILE</Link>
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
        letterSpacing: '0.3em',
        color: colors.textMuted,
        textDecoration: 'none',
        fontFamily: fonts.mono,
        fontWeight: 700,
      }}
    >
      {children}
    </Link>
  );
}
