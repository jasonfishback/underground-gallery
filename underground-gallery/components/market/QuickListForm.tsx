// components/market/QuickListForm.tsx
//
// Facebook-Marketplace style one-screen listing flow: photos first, a
// handful of fields, one "Post" click. Under the hood it chains the
// existing pipeline — create draft → upload photos → publish — so the
// full editors keep working unchanged for anyone who wants every field.

'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCarListing, createPartListing, publishDraft } from '@/app/market/actions';
import { CONDITION_LABELS, PRICE_TYPE_LABELS } from '@/lib/market/types';
import { LISTING_CONDITIONS, LISTING_PRICE_TYPES, PART_CATEGORIES } from '@/lib/db/schema';
import { colors, fonts } from '@/lib/design';

type Draft = {
  type: 'car' | 'part';
  title: string;
  price: string;
  priceType: (typeof LISTING_PRICE_TYPES)[number];
  condition: (typeof LISTING_CONDITIONS)[number];
  description: string;
  year: string;
  make: string;
  model: string;
  partCategory: (typeof PART_CATEGORIES)[number];
};

const INITIAL: Draft = {
  type: 'car',
  title: '',
  price: '',
  priceType: 'firm',
  condition: 'used',
  description: '',
  year: '',
  make: '',
  model: '',
  partCategory: 'Custom',
};

export function QuickListForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [d, setD] = useState<Draft>(INITIAL);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((cur) => ({ ...cur, [k]: v }));

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((cur) => [...cur, ...Array.from(list)].slice(0, 20));
  }

  // Cars can skip the title — "2004 Honda S2000" writes itself.
  const effectiveTitle =
    d.title.trim() ||
    (d.type === 'car' ? [d.year, d.make, d.model].filter(Boolean).join(' ').trim() : '');

  async function post() {
    setError(null);
    if (files.length === 0) return setError('Add at least one photo.');
    if (d.type === 'car' && (!d.year || !d.make.trim() || !d.model.trim()))
      return setError('Year, make, and model are required for a car.');
    if (effectiveTitle.length < 4) return setError('Give it a title (at least 4 characters).');
    const priceCents =
      d.priceType === 'free' ? 0 : d.price ? Math.round(Number(d.price) * 100) : null;
    if (d.priceType !== 'free' && d.priceType !== 'trade' && (priceCents == null || !Number.isFinite(priceCents) || priceCents < 0))
      return setError('Enter a price (or mark it Free / Trade).');

    const base = {
      title: effectiveTitle,
      description: d.description.trim() || null,
      priceCents,
      priceType: d.priceType,
      condition: d.condition,
      photoIds: [] as string[],
      primaryPhotoId: null,
    };

    try {
      setStatus('Creating listing…');
      const res =
        d.type === 'car'
          ? await createCarListing({
              ...base,
              listingType: 'car',
              year: Number(d.year),
              make: d.make.trim(),
              model: d.model.trim(),
            })
          : await createPartListing({
              ...base,
              listingType: 'part',
              partCategory: d.partCategory,
            });
      if (!res.ok) throw new Error(res.error);
      if (!res.data) throw new Error('Could not create the listing');
      const listingId = res.data.listingId;

      try {
        for (let i = 0; i < files.length; i++) {
          setStatus(`Uploading photo ${i + 1} of ${files.length}…`);
          const fd = new FormData();
          fd.append('file', files[i]);
          fd.append('listingId', listingId);
          const up = await fetch('/api/market/photos/upload', { method: 'POST', body: fd });
          const json = await up.json().catch(() => null);
          if (!up.ok || !json?.ok) throw new Error(json?.error ?? 'Photo upload failed');
        }

        setStatus('Publishing…');
        const pub = await publishDraft(listingId);
        if (!pub.ok) throw new Error(pub.error);

        router.push(`/market/${listingId}`);
      } catch (e) {
        // Draft exists — don't strand it; finish in the full editor.
        setStatus(null);
        setError(
          `${e instanceof Error ? e.message : 'Something failed'} — your draft was saved, finishing in the editor…`,
        );
        setTimeout(() => router.push(`/market/${listingId}/edit`), 1500);
      }
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontFamily: fonts.sans }}>
      {/* ── Photos first ── */}
      <div>
        <div className="ug-label" style={{ marginBottom: 8 }}>PHOTOS</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 8,
          }}
        >
          {previews.map((src, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 10,
                background: `${colors.bgElevated} url(${src}) center / cover no-repeat`,
                border: i === 0 ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                position: 'relative',
              }}
            >
              {i === 0 && (
                <span
                  style={{
                    position: 'absolute', top: 4, left: 4, fontSize: 9,
                    letterSpacing: '0.18em', background: colors.accent, color: '#fff',
                    padding: '2px 6px', borderRadius: 4, fontFamily: fonts.mono, fontWeight: 700,
                  }}
                >
                  COVER
                </span>
              )}
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                disabled={busy}
                style={{
                  position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                  borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 12, lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          {files.length < 20 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              style={{
                aspectRatio: '1 / 1',
                border: `1px dashed ${colors.borderStrong}`,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                color: colors.textMuted,
                fontSize: 11,
                fontFamily: fonts.mono,
                letterSpacing: '0.16em',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              + ADD
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* ── Car or part ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['car', 'part'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => set('type', t)}
            disabled={busy}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              fontFamily: fonts.mono,
              fontSize: 11,
              letterSpacing: '0.24em',
              fontWeight: 700,
              cursor: 'pointer',
              background: d.type === t ? colors.accentSoft : 'rgba(255,255,255,0.03)',
              color: d.type === t ? colors.accent : colors.textMuted,
              border: d.type === t ? `1px solid ${colors.accentBorder}` : `1px solid ${colors.border}`,
            }}
          >
            {t === 'car' ? 'CAR' : 'PART'}
          </button>
        ))}
      </div>

      {/* ── The essentials ── */}
      {d.type === 'car' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: 10 }}>
          <Field label="YEAR">
            <input className="ug-input" inputMode="numeric" placeholder="2004"
              value={d.year} onChange={(e) => set('year', e.target.value.replace(/\D/g, '').slice(0, 4))} disabled={busy} />
          </Field>
          <Field label="MAKE">
            <input className="ug-input" placeholder="Honda" value={d.make}
              onChange={(e) => set('make', e.target.value)} disabled={busy} />
          </Field>
          <Field label="MODEL">
            <input className="ug-input" placeholder="S2000" value={d.model}
              onChange={(e) => set('model', e.target.value)} disabled={busy} />
          </Field>
        </div>
      ) : (
        <Field label="CATEGORY">
          <select className="ug-input" value={d.partCategory}
            onChange={(e) => set('partCategory', e.target.value as Draft['partCategory'])} disabled={busy}>
            {PART_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      )}

      <Field label={d.type === 'car' ? 'TITLE (OPTIONAL — WE’LL USE YEAR MAKE MODEL)' : 'TITLE'}>
        <input className="ug-input"
          placeholder={d.type === 'car' ? effectiveTitle || 'e.g. 2004 Honda S2000' : 'e.g. Garrett GT2871R turbo'}
          value={d.title} onChange={(e) => set('title', e.target.value)} disabled={busy} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="PRICE (USD)">
          <input className="ug-input" inputMode="decimal" placeholder="12500"
            value={d.priceType === 'free' ? '' : d.price}
            onChange={(e) => set('price', e.target.value.replace(/[^0-9.]/g, ''))}
            disabled={busy || d.priceType === 'free'} />
        </Field>
        <Field label="CONDITION">
          <select className="ug-input" value={d.condition}
            onChange={(e) => set('condition', e.target.value as Draft['condition'])} disabled={busy}>
            {LISTING_CONDITIONS.map((c) => (
              <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
            ))}
          </select>
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {LISTING_PRICE_TYPES.map((pt) => (
          <button key={pt} type="button" onClick={() => set('priceType', pt)} disabled={busy}
            style={{
              padding: '7px 13px', borderRadius: 999, fontFamily: fonts.mono, fontSize: 10,
              letterSpacing: '0.2em', fontWeight: 700, cursor: 'pointer',
              background: d.priceType === pt ? colors.accentSoft : 'rgba(255,255,255,0.03)',
              color: d.priceType === pt ? colors.accent : colors.textMuted,
              border: d.priceType === pt ? `1px solid ${colors.accentBorder}` : `1px solid ${colors.border}`,
            }}>
            {PRICE_TYPE_LABELS[pt].toUpperCase()}
          </button>
        ))}
      </div>

      <Field label="DESCRIPTION (OPTIONAL)">
        <textarea className="ug-input" rows={4}
          placeholder="Condition details, history, what's included…"
          value={d.description} onChange={(e) => set('description', e.target.value)} disabled={busy} />
      </Field>

      {error && <div className="ug-banner ug-banner-error">{error}</div>}

      <button type="button" onClick={post} disabled={busy} className="ug-btn ug-btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}>
        {status ?? 'POST LISTING'}
      </button>

      <div style={{ fontSize: 12, color: colors.textDim, textAlign: 'center' }}>
        Posts live immediately · need every field?{' '}
        <Link href="/market/new/car" style={{ color: colors.textMuted }}>full car form</Link>
        {' · '}
        <Link href="/market/new/part" style={{ color: colors.textMuted }}>full part form</Link>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="ug-label">{label}</span>
      {children}
    </label>
  );
}
