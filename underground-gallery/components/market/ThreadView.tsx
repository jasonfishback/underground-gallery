// components/market/ThreadView.tsx
//
// Realtime thread view for one listing-message conversation.
// Subscribes to a private Pusher channel and prepends new messages as they
// arrive. Falls back to plain on-submit refresh when Pusher isn't configured.

'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';
import { sendMessage, markThreadRead } from '@/app/market/actions';

type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: Date | string;
  readAt: Date | string | null;
};

export function ThreadView({
  listingId,
  meId,
  otherId,
  otherCallsign,
  initialMessages,
  pusherKey,
  pusherCluster,
}: {
  listingId: string;
  meId: string;
  otherId: string;
  otherCallsign: string | null;
  initialMessages: Message[];
  pusherKey: string | null;
  pusherCluster: string | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Mark unread messages from other user as read on mount
  useEffect(() => {
    void markThreadRead(listingId, otherId);
  }, [listingId, otherId]);

  // Subscribe to realtime channel
  useEffect(() => {
    if (!pusherKey || !pusherCluster) return;
    // Channel format must match listingThreadChannelName() in lib/market/pusher.ts:
    // dashes stripped from UUIDs, IDs sorted alphabetically.
    const a = meId.replace(/-/g, '');
    const b = otherId.replace(/-/g, '');
    const [low, high] = [a, b].sort();
    const channelName = `private-listing-msg-${listingId}-${low}-${high}`;
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/listing-auth',
    });
    const channel = pusher.subscribe(channelName);
    channel.bind('message', (data: { messageId: string; fromUserId: string; body: string; createdAt: number }) => {
      // Only react to messages from the other party — our own optimistic
      // append already happened.
      if (data.fromUserId === meId) return;
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId,
          fromUserId: data.fromUserId,
          toUserId: meId,
          body: data.body,
          createdAt: new Date(data.createdAt),
          readAt: null,
        },
      ]);
      void markThreadRead(listingId, otherId);
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [listingId, meId, otherId, pusherKey, pusherCluster]);

  // Scroll to bottom on new message
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = body.trim();
    if (!text) return;
    // Optimistic
    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        fromUserId: meId,
        toUserId: otherId,
        body: text,
        createdAt: new Date(),
        readAt: null,
      },
    ]);
    setBody('');

    start(async () => {
      const r = await sendMessage({ listingId, toUserId: otherId, body: text });
      if (!r.ok) {
        setError(r.error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setBody(text);
      } else {
        // Replace temp with the real ID; keep the row otherwise as-is
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, id: r.data!.messageId } : m,
          ),
        );
        router.refresh();
      }
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
        minHeight: 480,
        background: 'rgba(20,22,30,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
      }}
    >
      <header
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: 'rgba(245,246,247,0.55)',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            CONVERSATION WITH
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
            {otherCallsign ?? 'Member'}
          </div>
        </div>
        <a
          href={`/market/${listingId}`}
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            color: '#ff5252',
            textDecoration: 'none',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
        >
          VIEW LISTING →
        </a>
      </header>

      <div
        ref={scrollerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(245,246,247,0.5)', fontSize: 13, marginTop: 40 }}>
            No messages yet — say hi.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.fromUserId === meId;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: mine ? '#ff3030' : 'rgba(255,255,255,0.06)',
                  color: mine ? '#fff' : 'rgba(245,246,247,0.92)',
                  fontSize: 14,
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.body}
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.6,
                    marginTop: 4,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={submit}
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
          style={{
            flex: 1,
            background: '#0a0c12',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            borderRadius: 999,
            padding: '10px 16px',
            fontSize: 14,
            fontFamily: "'Inter Tight', system-ui, sans-serif",
          }}
        />
        <button type="submit" disabled={isPending || !body.trim()} className="ug-btn ug-btn-primary ug-pill">
          {isPending ? '…' : 'SEND'}
        </button>
      </form>
      {error && (
        <div style={{ color: '#ff5252', fontSize: 12, padding: '0 12px 10px' }}>{error}</div>
      )}
    </div>
  );
}
