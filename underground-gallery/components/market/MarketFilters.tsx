// components/market/MarketFilters.tsx
//
// Client component. Filter sidebar / drawer on the browse pages.
// Reads/writes URL search params so filter state is shareable + bookmarkable.

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  LISTING_CONDITIONS,
  PART_CATEGORIES,
} from '@/lib/db/schema';
import { CONDITION_LABELS } from '@/lib/market/types';

type Props = {
  type?: 'car' | 'part' | undefined;
};

export function MarketFilters({ type }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const get = (k: string) => sp.get(k) ?? '';

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    next.delete('page');
    start(() => router.push(`${pathname}?${next.toString()}`));
  }

  function clear() {
    start(() => router.push(pathname));
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="ug-btn"
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-block',
          marginBottom: 14,
        }}
      >
        {open ? 'Hide filters' : 'Show filters'}
      </button>

      <aside
        style={{
          display: open ? 'flex' : 'none',
          flexDirection: 'column',
          gap: 18,
          padding: 18,
          background: 'rgba(20,22,30,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          fontFamily: "'Inter Tight', system-ui, sans-serif",
          opacity: isPending ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <FilterRow label="Sort">
          <select
            value={get('sort') || 'newest'}
            onChange={(e) => update({ sort: e.target.value })}
            style={inputStyle}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </select>
        </FilterRow>

        <FilterRow label="Condition">
          <select
            value={get('condition')}
            onChange={(e) => update({ condition: e.target.value })}
            style={inputStyle}
          >
            <option value="">Any condition</option>
            {LISTING_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </FilterRow>

        <FilterRow label="Price (USD)">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              inputMode="numeric"
              placeholder="min"
              defaultValue={get('priceMin')}
              onBlur={(e) => update({ priceMin: e.target.value })}
              style={inputStyle}
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="max"
              defaultValue={get('priceMax')}
              onBlur={(e) => update({ priceMax: e.target.value })}
              style={inputStyle}
            />
          </div>
        </FilterRow>

        {type === 'car' && (
          <>
            <FilterRow label="Make">
              <input
                placeholder="e.g. Nissan"
                defaultValue={get('make')}
                onBlur={(e) => update({ make: e.target.value })}
                style={inputStyle}
              />
            </FilterRow>
            <FilterRow label="Model">
              <input
                placeholder="e.g. Skyline"
                defaultValue={get('model')}
                onBlur={(e) => update({ model: e.target.value })}
                style={inputStyle}
              />
            </FilterRow>
            <FilterRow label="Year range">
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="from"
                  defaultValue={get('yearMin')}
                  onBlur={(e) => update({ yearMin: e.target.value })}
                  style={inputStyle}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="to"
                  defaultValue={get('yearMax')}
                  onBlur={(e) => update({ yearMax: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </FilterRow>
          </>
        )}

        {type === 'part' && (
          <FilterRow label="Category">
            <select
              value={get('category')}
              onChange={(e) => update({ category: e.target.value })}
              style={inputStyle}
            >
              <option value="">All categories</option>
              {PART_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterRow>
        )}

        <button
          type="button"
          onClick={clear}
          className="ug-btn"
          style={{ alignSelf: 'flex-start' }}
        >
          Clear all
        </button>
      </aside>
    </>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          color: 'rgba(245,246,247,0.55)',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 700,
        }}
      >
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0a0c12',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  fontFamily: "'Inter Tight', system-ui, sans-serif",
  width: '100%',
};
