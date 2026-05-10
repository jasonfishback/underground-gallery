// app/market/messages/page.tsx — list of all my conversations.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getAuthContext } from '@/lib/auth/gates';
import { getThreadsForUser } from '@/lib/market/queries';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Messages' };

export default async function MarketMessagesPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const threads = await getThreadsForUser(ctx.userId);

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 880,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: '#ff3030',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 700,
        }}
      >
        UNDERGROUND · MESSAGES
      </div>
      <h1 style={{ fontSize: 28, margin: '4px 0 22px' }}>Conversations</h1>

      {threads.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'rgba(245,246,247,0.55)',
            background: 'rgba(20,22,30,0.4)',
            border: '1px dashed rgba(255,255,255,0.12)',
            borderRadius: 12,
          }}
        >
          No conversations yet. <Link href="/market" style={{ color: '#ff5252' }}>Browse the market →</Link>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {threads.map((t) => {
            const slug = `${t.listingId}-${t.otherUserId}`;
            return (
              <li key={slug}>
                <Link
                  href={`/market/messages/${slug}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 14,
                    background:
                      t.unreadCount > 0
                        ? 'rgba(255,42,42,0.08)'
                        : 'rgba(20,22,30,0.5)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      flexShrink: 0,
                      background: t.listingPhotoUrl
                        ? `#0a0c12 url(${t.listingPhotoUrl}) center/cover`
                        : 'linear-gradient(135deg, #1a1d28, #0f1119)',
                      borderRadius: 8,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.listingTitle}
                      </strong>
                      {t.unreadCount > 0 && (
                        <span
                          style={{
                            background: '#ff3030',
                            color: '#fff',
                            padding: '2px 8px',
                            fontSize: 11,
                            borderRadius: 999,
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontWeight: 700,
                          }}
                        >
                          {t.unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(245,246,247,0.55)', marginTop: 2 }}>
                      {t.isSeller ? 'From' : 'To'} {t.otherCallsign ?? 'Member'} ·{' '}
                      {new Date(t.lastMessageAt).toLocaleDateString()}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'rgba(245,246,247,0.75)',
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.lastMessageBody}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
