// components/market/MarketSearchBar.tsx
//
// Client component. Top-of-page search input + type tabs.

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { colors, fonts } from '@/lib/design';

export function MarketSearchBar({
  showTabs = true,
  type,
}: {
  showTabs?: boolean;
  type?: 'car' | 'part';
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [isPending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(sp.toString());
    if (q.trim()) next.set('q', q.trim());
    else next.delete('q');
    next.delete('page');
    start(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div
      className="ug-glass"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        marginBottom: 22,
        padding: 14,
      }}
    >
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search cars, parts, brands..."
          className="ug-input"
          style={{ flex: 1, borderRadius: 999 }}
        />
        <button type="submit" className="ug-btn ug-btn-primary ug-pill">
          {isPending ? '…' : 'SEARCH'}
        </button>
      </form>

      {showTabs && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            fontFamily: fonts.mono,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Tab href="/market" active={!type}>ALL</Tab>
          <Tab href="/market/cars" active={type === 'car'}>CARS</Tab>
          <Tab href="/market/parts" active={type === 'part'}>PARTS</Tab>
          <span style={{ flex: 1 }} />
          <Link
            href="/market/saved"
            style={subLinkStyle}
          >
            SAVED
          </Link>
          <Link
            href="/market/messages"
            style={subLinkStyle}
          >
            MESSAGES
          </Link>
          <Link
            href="/market/mine"
            style={subLinkStyle}
          >
            MINE
          </Link>
          <Link
            href="/market/new"
            className="ug-btn ug-btn-primary ug-pill"
          >
            + LIST
          </Link>
        </div>
      )}
    </div>
  );
}

const subLinkStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 10,
  letterSpacing: '0.22em',
  fontWeight: 700,
  textDecoration: 'none',
  color: colors.textMuted,
};

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 10,
        letterSpacing: '0.22em',
        fontWeight: 700,
        textDecoration: 'none',
        background: active ? colors.accentSoft : 'rgba(255,255,255,0.04)',
        color: active ? colors.accent : colors.textMuted,
        border: active ? `1px solid ${colors.accentBorder}` : '1px solid transparent',
      }}
    >
      {children}
    </Link>
  );
}
