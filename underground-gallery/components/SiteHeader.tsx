// components/SiteHeader.tsx
//
// Sticky top nav. iOS-style frosted glass with subtle red accent line.
// Uses the design tokens from globals.css (.ug-glass / .ug-btn / pill styling).

import Link from 'next/link';
import { getAuthContext } from '@/lib/auth/gates';
import { getRecentNotifications } from '@/lib/notifications/fetch';
import { NotificationBell } from '@/components/NotificationBell';
import { DesktopNav, MobileTabBar } from '@/components/SiteNav';
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
        // Pad below the iOS status bar / notch in installed (standalone) PWAs —
        // otherwise the translucent status bar sits on top of the header and it
        // reads as hidden until you overscroll. env() is 0 in normal browsers.
        paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
        paddingRight: 'calc(20px + env(safe-area-inset-right, 0px))',
        paddingBottom: 14,
        paddingLeft: 'calc(20px + env(safe-area-inset-left, 0px))',
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
        }}
      >
        {/* Full pill nav — hidden < 720px (mobile gets the bottom tab bar) */}
        <DesktopNav isModerator={ctx.isModerator} />

        {/* Always-visible utilities: invite (mobile), admin (mobile), bell */}
        <span className="ug-nav-mobile-utils" style={{ display: 'contents' }}>
          <Link
            href="/invites"
            className="ug-btn ug-btn-primary ug-pill ug-nav-mobile-only"
          >
            + INVITE
          </Link>
          {ctx.isModerator && (
            <Link
              href="/admin"
              className="ug-pill ug-mono ug-nav-mobile-only"
              style={{
                fontSize: 10,
                letterSpacing: '0.22em',
                color: colors.textMuted,
                textDecoration: 'none',
                fontWeight: 700,
                border: `1px solid ${colors.border}`,
              }}
            >
              ADMIN
            </Link>
          )}
        </span>
        <NotificationBell notifications={notifs} />
      </div>

      {/* App-style bottom tab bar on phones */}
      <MobileTabBar />
    </header>
  );
}
