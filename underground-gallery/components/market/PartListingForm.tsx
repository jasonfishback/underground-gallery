// components/market/PartListingForm.tsx
//
// Client form for creating or editing a part listing.

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPartListing, updateListing } from '@/app/market/actions';
import {
  LISTING_CONDITIONS,
  LISTING_PRICE_TYPES,
  PART_CATEGORIES,
} from '@/lib/db/schema';
import { CONDITION_LABELS, PRICE_TYPE_LABELS } from '@/lib/market/types';
import { colors, fonts } from '@/lib/design';

type FormState = {
  title: string;
  description: string;
  priceCents: string;
  priceType: (typeof LISTING_PRICE_TYPES)[number];
  condition: (typeof LISTING_CONDITIONS)[number];
  partCategory: (typeof PART_CATEGORIES)[number];
  partBrand: string;
  partNumber: string;
  oemNumber: string;
  fitmentMake: string;
  fitmentModel: string;
  fitmentYearFrom: string;
  fitmentYearTo: string;
  fitmentTrim: string;
  fitmentNotes: string;
  quantity: string;
  locationLabel: string;
};

export function PartListingForm({
  mode,
  listingId,
  initial,
}: {
  mode: 'create' | 'edit';
  listingId?: string;
  initial?: Partial<FormState>;
}) {
  const router = useRouter();
  const [s, setS] = useState<FormState>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    priceCents: initial?.priceCents ?? '',
    priceType: (initial?.priceType as any) ?? 'firm',
    condition: (initial?.condition as any) ?? 'used',
    partCategory: (initial?.partCategory as any) ?? 'Custom',
    partBrand: initial?.partBrand ?? '',
    partNumber: initial?.partNumber ?? '',
    oemNumber: initial?.oemNumber ?? '',
    fitmentMake: initial?.fitmentMake ?? '',
    fitmentModel: initial?.fitmentModel ?? '',
    fitmentYearFrom: initial?.fitmentYearFrom ?? '',
    fitmentYearTo: initial?.fitmentYearTo ?? '',
    fitmentTrim: initial?.fitmentTrim ?? '',
    fitmentNotes: initial?.fitmentNotes ?? '',
    quantity: initial?.quantity ?? '1',
    locationLabel: initial?.locationLabel ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      listingType: 'part' as const,
      title: s.title.trim(),
      description: s.description.trim() || null,
      priceCents: s.priceType === 'free' ? 0 : s.priceCents ? Number(s.priceCents) * 100 : null,
      priceType: s.priceType,
      condition: s.condition,
      partCategory: s.partCategory,
      partBrand: s.partBrand.trim() || null,
      partNumber: s.partNumber.trim() || null,
      oemNumber: s.oemNumber.trim() || null,
      fitmentMake: s.fitmentMake.trim() || null,
      fitmentModel: s.fitmentModel.trim() || null,
      fitmentYearFrom: s.fitmentYearFrom ? Number(s.fitmentYearFrom) : null,
      fitmentYearTo: s.fitmentYearTo ? Number(s.fitmentYearTo) : null,
      fitmentTrim: s.fitmentTrim.trim() || null,
      fitmentNotes: s.fitmentNotes.trim() || null,
      quantity: s.quantity ? Number(s.quantity) : 1,
      photoIds: [],
      primaryPhotoId: null,
      locationLabel: s.locationLabel.trim() || null,
    };

    start(async () => {
      if (mode === 'create') {
        const r = await createPartListing(payload);
        if (!r.ok) setError(r.error);
        else router.push(`/market/${r.data!.listingId}/edit?just_created=1`);
      } else if (mode === 'edit' && listingId) {
        const r = await updateListing(listingId, payload);
        if (!r.ok) setError(r.error);
        else router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} style={formStyle}>
      <Section title="The basics">
        <Field label="Listing title" required>
          <input
            value={s.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={140}
            placeholder="e.g. Garrett G25-660 turbo, never installed"
            required
            className="ug-input"
          />
        </Field>
        <Two>
          <Field label="Category" required>
            <select
              value={s.partCategory}
              onChange={(e) => set('partCategory', e.target.value as any)}
              required
              className="ug-input"
            >
              {PART_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Condition" required>
            <select
              value={s.condition}
              onChange={(e) => set('condition', e.target.value as any)}
              required
              className="ug-input"
            >
              {LISTING_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </select>
          </Field>
        </Two>
        <Two>
          <Field label="Brand">
            <input
              value={s.partBrand}
              onChange={(e) => set('partBrand', e.target.value)}
              placeholder="Garrett, Cobb, Brembo"
              className="ug-input"
            />
          </Field>
          <Field label="Quantity">
            <input
              type="number"
              inputMode="numeric"
              value={s.quantity}
              onChange={(e) => set('quantity', e.target.value)}
              min={1}
              className="ug-input"
            />
          </Field>
        </Two>
        <Two>
          <Field label="Part number">
            <input
              value={s.partNumber}
              onChange={(e) => set('partNumber', e.target.value)}
              className="ug-input"
            />
          </Field>
          <Field label="OEM number">
            <input
              value={s.oemNumber}
              onChange={(e) => set('oemNumber', e.target.value)}
              className="ug-input"
            />
          </Field>
        </Two>
      </Section>

      <Section title="Fitment">
        <Two>
          <Field label="Fits make">
            <input
              value={s.fitmentMake}
              onChange={(e) => set('fitmentMake', e.target.value)}
              placeholder="Subaru"
              className="ug-input"
            />
          </Field>
          <Field label="Fits model">
            <input
              value={s.fitmentModel}
              onChange={(e) => set('fitmentModel', e.target.value)}
              placeholder="WRX"
              className="ug-input"
            />
          </Field>
        </Two>
        <Two>
          <Field label="Year from">
            <input
              type="number"
              inputMode="numeric"
              value={s.fitmentYearFrom}
              onChange={(e) => set('fitmentYearFrom', e.target.value)}
              className="ug-input"
            />
          </Field>
          <Field label="Year to">
            <input
              type="number"
              inputMode="numeric"
              value={s.fitmentYearTo}
              onChange={(e) => set('fitmentYearTo', e.target.value)}
              className="ug-input"
            />
          </Field>
        </Two>
        <Field label="Trim">
          <input
            value={s.fitmentTrim}
            onChange={(e) => set('fitmentTrim', e.target.value)}
            placeholder="STi only, e.g."
            className="ug-input"
          />
        </Field>
        <Field label="Fitment notes">
          <input
            value={s.fitmentNotes}
            onChange={(e) => set('fitmentNotes', e.target.value)}
            maxLength={500}
            placeholder="May need adapter, requires welding, etc."
            className="ug-input"
          />
        </Field>
      </Section>

      <Section title="Price">
        <Two>
          <Field label="Asking price (USD)">
            <input
              type="number"
              inputMode="numeric"
              value={s.priceCents}
              onChange={(e) => set('priceCents', e.target.value)}
              disabled={s.priceType === 'free'}
              className="ug-input"
            />
          </Field>
          <Field label="Price type">
            <select
              value={s.priceType}
              onChange={(e) => set('priceType', e.target.value as any)}
              className="ug-input"
            >
              {LISTING_PRICE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PRICE_TYPE_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
        </Two>
      </Section>

      <Section title="Details">
        <Field label="Description">
          <textarea
            value={s.description}
            onChange={(e) => set('description', e.target.value)}
            rows={5}
            maxLength={8000}
            className="ug-input"
            style={{ resize: 'vertical' }}
            placeholder="Mileage, install history, defects, why you're selling."
          />
        </Field>
        <Field label="Location (city, state)">
          <input
            value={s.locationLabel}
            onChange={(e) => set('locationLabel', e.target.value)}
            placeholder="Defaults to your member region"
            className="ug-input"
          />
        </Field>
      </Section>

      {error && <div className="ug-banner ug-banner-error">{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={isPending} className="ug-btn ug-btn-primary">
          {isPending ? 'Saving…' : mode === 'create' ? 'Continue → add photos' : 'Save changes'}
        </button>
        {mode === 'edit' && (
          <button type="button" className="ug-btn ug-btn-ghost" onClick={() => router.push('/market/mine')}>
            Done
          </button>
        )}
      </div>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  fontFamily: fonts.sans,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset
      className="ug-card"
      style={{
        padding: '18px 18px 22px',
        margin: 0,
      }}
    >
      <legend
        style={{
          fontSize: 11,
          letterSpacing: '0.3em',
          color: colors.textMuted,
          fontFamily: fonts.mono,
          fontWeight: 700,
          padding: '0 8px',
        }}
      >
        ∕∕ {title.toUpperCase()}
      </legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </fieldset>
  );
}

function Two({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span className="ug-label">
        {label}
        {required && <span style={{ color: colors.accent }}> *</span>}
      </span>
      {children}
    </label>
  );
}
