// components/market/MarketSearchBar.tsx
//
// Client component. Top-of-page search input + type tabs.

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search cars, parts, brands..."
          style={{
            flex: 1,
            background: '#0a0c12',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            borderRadius: 999,
            padding: '12px 18px',
            fontSize: 15,
            fontFamily: "'Inter Tight', system-ui, sans-serif",
          }}
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
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
  color: 'rgba(245,246,247,0.6)',
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
        background: active ? 'rgba(255,42,42,0.18)' : 'rgba(255,255,255,0.04)',
        color: active ? '#ff5252' : 'rgba(245,246,247,0.65)',
        border: active ? '1px solid rgba(255,42,42,0.35)' : '1px solid transparent',
      }}
    >
      {children}
    </Link>
  );
}
