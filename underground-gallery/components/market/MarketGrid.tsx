// components/market/MarketGrid.tsx
//
// Facebook-Marketplace style browse grid: dense card grid + infinite scroll.
// First page arrives server-rendered via props; subsequent pages stream in
// from /api/market/browse as the sentinel scrolls into view.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MarketCard } from './MarketCard';
import type { ListingCard } from '@/lib/market/queries';
import { colors, fonts } from '@/lib/design';

export function MarketGrid({
  rows,
  total,
  page,
  pageSize,
  basePath,
  searchParams,
  emptyHint,
}: {
  rows: ListingCard[];
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  emptyHint?: string;
}) {
  // /market/cars and /market/parts scope the feed by listing type.
  const type =
    basePath === '/market/cars' ? 'car' : basePath === '/market/parts' ? 'part' : undefined;

  // Changing filters re-renders the page with new props; reset client state.
  const filterKey = useMemo(
    () => `${basePath}|${JSON.stringify(searchParams)}`,
    [basePath, searchParams],
  );

  const [extraRows, setExtraRows] = useState<ListingCard[]>([]);
  const [nextPage, setNextPage] = useState(page + 1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setExtraRows([]);
    setNextPage(page + 1);
    setFailed(false);
  }, [filterKey, page]);

  const allRows = useMemo(() => {
    const seen = new Set(rows.map((r) => r.id));
    return [...rows, ...extraRows.filter((r) => !seen.has(r.id))];
  }, [rows, extraRows]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasMore = nextPage <= totalPages;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || failed) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        setLoading(true);
        try {
          const qs = new URLSearchParams(
            Object.entries(searchParams).filter(([k, v]) => !!v && k !== 'page') as [
              string,
              string,
            ][],
          );
          if (type) qs.set('type', type);
          qs.set('page', String(nextPage));
          const res = await fetch(`/api/market/browse?${qs.toString()}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: { rows: ListingCard[] } = await res.json();
          setExtraRows((prev) => [...prev, ...data.rows]);
          setNextPage((p) => p + 1);
        } catch {
          setFailed(true);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: '600px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, failed, nextPage, searchParams, type]);

  if (allRows.length === 0) {
    return (
      <div
        className="ug-card"
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          color: colors.textMuted,
          fontFamily: fonts.sans,
        }}
      >
        <div style={{ fontSize: 16, marginBottom: 6, color: colors.text }}>Nothing here yet.</div>
        <div style={{ fontSize: 13 }}>
          {emptyHint ?? 'Try clearing filters or check back soon.'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '26px 14px',
        }}
      >
        {allRows.map((r) => (
          <MarketCard key={r.id} listing={r} />
        ))}
      </div>

      <div
        ref={sentinelRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '28px 0 8px',
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: '0.24em',
          color: colors.textDim,
        }}
      >
        {loading
          ? 'LOADING MORE…'
          : failed
            ? (
                <button
                  onClick={() => setFailed(false)}
                  className="ug-btn ug-btn-ghost"
                  style={{ fontFamily: fonts.mono }}
                >
                  COULDN&apos;T LOAD — RETRY
                </button>
              )
            : hasMore
              ? '· · ·'
              : allRows.length > pageSize
                ? "THAT'S EVERYTHING"
                : null}
      </div>
    </>
  );
}
