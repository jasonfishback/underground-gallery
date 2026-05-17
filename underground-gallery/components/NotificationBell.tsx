// components/NotificationBell.tsx
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markNotificationRead, markAllNotificationsRead } from '@/app/race/actions';
import { colors, fonts } from '@/lib/design';

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type Props = {
  notifications: Notif[];
};

export function NotificationBell({ notifications }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const unread = notifications.filter((n) => !n.readAt);
  const unreadCount = unread.length;

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleClick(n: Notif) {
    if (!n.readAt) {
      startTransition(async () => {
        await markNotificationRead(n.id);
      });
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((x) => !x)}
        aria-label="Notifications"
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.text,
          cursor: 'pointer',
          padding: 8,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: fonts.mono,
          fontSize: 12,
        }}
      >
        <span style={{ fontSize: 18 }}>🔔</span>
        {unreadCount > 0 && (
          <span
            className="ug-mono"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: colors.accent,
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 8,
              minWidth: 16,
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="ug-glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxHeight: 480,
            overflowY: 'auto',
            zIndex: 100,
            padding: 0,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              className="ug-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                color: colors.accent,
                fontWeight: 700,
              }}
            >
              // NOTIFICATIONS
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="ug-btn ug-btn-text"
                style={{
                  padding: '4px 8px',
                  fontSize: 9,
                  letterSpacing: '0.2em',
                }}
              >
                MARK ALL READ
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: colors.textMuted,
                fontSize: 12,
              }}
            >
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  background: !n.readAt ? colors.accentSoft : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${colors.border}`,
                  color: colors.text,
                  cursor: n.link ? 'pointer' : 'default',
                  fontFamily: fonts.sans,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  {n.title}
                </div>
                {n.body && (
                  <div
                    style={{
                      fontSize: 11,
                      color: colors.textMuted,
                      lineHeight: 1.5,
                    }}
                  >
                    {n.body}
                  </div>
                )}
                <div
                  className="ug-mono"
                  style={{
                    fontSize: 9,
                    color: colors.textDim,
                    marginTop: 6,
                  }}
                >
                  {timeAgo(n.createdAt)}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(d: Date): string {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}
