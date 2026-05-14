// components/market/CarListingForm.tsx
//
// Client component for creating or editing a car listing. Runs the
// createCarListing or updateListing server action depending on mode.

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCarListing, updateListing } from '@/app/market/actions';
import {
  LISTING_CONDITIONS,
  LISTING_PRICE_TYPES,
  LISTING_TITLE_STATUSES,
} from '@/lib/db/schema';
import {
  CONDITION_LABELS,
  PRICE_TYPE_LABELS,
  TITLE_STATUS_LABELS,
} from '@/lib/market/types';
import { GarageLinkPicker } from './GarageLinkPicker';
import { colors, fonts } from '@/lib/design';

type GarageVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  vin: string | null;
};

type FormState = {
  title: string;
  description: string;
  priceCents: string;
  priceType: (typeof LISTING_PRICE_TYPES)[number];
  condition: (typeof LISTING_CONDITIONS)[number];
  year: string;
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  vin: string;
  mileage: string;
  color: string;
  transmission: string;
  drivetrain: string;
  titleStatus: (typeof LISTING_TITLE_STATUSES)[number] | '';
  modsSummary: string;
  garageVehicleId: string;
  locationLabel: string;
};

type Props = {
  mode: 'create' | 'edit';
  listingId?: string;
  garageVehicles: GarageVehicle[];
  initial?: Partial<FormState>;
};

export function CarListingForm({ mode, listingId, garageVehicles, initial }: Props) {
  const router = useRouter();
  const [s, setS] = useState<FormState>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    priceCents: initial?.priceCents ?? '',
    priceType: (initial?.priceType as any) ?? 'firm',
    condition: (initial?.condition as any) ?? 'used',
    year: initial?.year ?? '',
    make: initial?.make ?? '',
    model: initial?.model ?? '',
    trim: initial?.trim ?? '',
    bodyStyle: initial?.bodyStyle ?? '',
    vin: initial?.vin ?? '',
    mileage: initial?.mileage ?? '',
    color: initial?.color ?? '',
    transmission: initial?.transmission ?? '',
    drivetrain: initial?.drivetrain ?? '',
    titleStatus: (initial?.titleStatus as any) ?? '',
    modsSummary: initial?.modsSummary ?? '',
    garageVehicleId: initial?.garageVehicleId ?? '',
    locationLabel: initial?.locationLabel ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  function autofillFromGarage(v: GarageVehicle | null) {
    if (!v) {
      set('garageVehicleId', '');
      return;
    }
    setS((prev) => ({
      ...prev,
      garageVehicleId: v.id,
      year: String(v.year),
      make: v.make,
      model: v.model,
      trim: v.trim ?? '',
      color: v.color ?? prev.color,
      vin: v.vin ?? prev.vin,
      title: prev.title || `${v.year} ${v.make} ${v.model}${v.trim ? ' ' + v.trim : ''}`,
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      listingType: 'car' as const,
      title: s.title.trim(),
      description: s.description.trim() || null,
      priceCents: s.priceType === 'free' ? 0 : s.priceCents ? Number(s.priceCents) * 100 : null,
      priceType: s.priceType,
      condition: s.condition,
      year: Number(s.year),
      make: s.make.trim(),
      model: s.model.trim(),
      trim: s.trim.trim() || null,
      bodyStyle: s.bodyStyle.trim() || null,
      vin: s.vin.trim() || null,
      mileage: s.mileage ? Number(s.mileage) : null,
      color: s.color.trim() || null,
      transmission: s.transmission.trim() || null,
      drivetrain: s.drivetrain.trim() || null,
      titleStatus: s.titleStatus || null,
      modsSummary: s.modsSummary.trim() || null,
      garageVehicleId: s.garageVehicleId || null,
      photoIds: [],
      primaryPhotoId: null,
      locationLabel: s.locationLabel.trim() || null,
    };

    start(async () => {
      if (mode === 'create') {
        const r = await createCarListing(payload);
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
      {mode === 'create' && garageVehicles.length > 0 && (
        <GarageLinkPicker vehicles={garageVehicles} onPick={autofillFromGarage} />
      )}

      <Section title="The basics">
        <Field label="Listing title" required>
          <input
            value={s.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={140}
            placeholder="e.g. 2008 BMW M3 — 65k mi, clean title"
            required
            className="ug-input"
          />
        </Field>

        <Two>
          <Field label="Year" required>
            <input
              type="number"
              inputMode="numeric"
              value={s.year}
              onChange={(e) => set('year', e.target.value)}
              required
              min={1900}
              max={2100}
              className="ug-input"
            />
          </Field>
          <Field label="Color">
            <input
              value={s.color}
              onChange={(e) => set('color', e.target.value)}
              className="ug-input"
            />
          </Field>
        </Two>

        <Two>
          <Field label="Make" required>
            <input
              value={s.make}
              onChange={(e) => set('make', e.target.value)}
              required
              className="ug-input"
            />
          </Field>
          <Field label="Model" required>
            <input
              value={s.model}
              onChange={(e) => set('model', e.target.value)}
              required
              className="ug-input"
            />
          </Field>
        </Two>

        <Two>
          <Field label="Trim">
            <input
              value={s.trim}
              onChange={(e) => set('trim', e.target.value)}
              className="ug-input"
            />
          </Field>
          <Field label="Body style">
            <input
              value={s.bodyStyle}
              onChange={(e) => set('bodyStyle', e.target.value)}
              placeholder="Coupe, Sedan, etc."
              className="ug-input"
            />
          </Field>
        </Two>

        <Two>
          <Field label="Mileage (mi)">
            <input
              type="number"
              inputMode="numeric"
              value={s.mileage}
              onChange={(e) => set('mileage', e.target.value)}
              className="ug-input"
            />
          </Field>
          <Field label="Condition" required>
            <select
              value={s.condition}
              onChange={(e) => set('condition', e.target.value as any)}
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
          <Field label="Transmission">
            <input
              value={s.transmission}
              onChange={(e) => set('transmission', e.target.value)}
              placeholder="Manual, Auto, DCT"
              className="ug-input"
            />
          </Field>
          <Field label="Drivetrain">
            <input
              value={s.drivetrain}
              onChange={(e) => set('drivetrain', e.target.value)}
              placeholder="RWD, AWD, FWD"
              className="ug-input"
            />
          </Field>
        </Two>

        <Two>
          <Field label="Title status">
            <select
              value={s.titleStatus}
              onChange={(e) => set('titleStatus', e.target.value as any)}
              className="ug-input"
            >
              <option value="">— Not specified —</option>
              {LISTING_TITLE_STATUSES.map((t) => (
                <option key={t} value={t}>
                  {TITLE_STATUS_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="VIN (optional)">
            <input
              value={s.vin}
              onChange={(e) => set('vin', e.target.value)}
              maxLength={20}
              className="ug-input"
            />
          </Field>
        </Two>
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
            rows={6}
            maxLength={8000}
            placeholder="Tell the story. Service history, known issues, why you're selling."
            className="ug-input"
            style={{ resize: 'vertical' }}
          />
        </Field>
        <Field label="Mods (short summary)">
          <textarea
            value={s.modsSummary}
            onChange={(e) => set('modsSummary', e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Stage 2 tune, Cobb AP, Mishimoto IC..."
            className="ug-input"
            style={{ resize: 'vertical' }}
          />
        </Field>
        <Field label="Location (city, state)">
          <input
            value={s.locationLabel}
            onChange={(e) => set('locationLabel', e.target.value)}
            placeholder={initial?.locationLabel ?? 'Defaults to your member region'}
            className="ug-input"
          />
        </Field>
      </Section>

      {error && <div className="ug-banner ug-banner-error">{error}</div>}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" disabled={isPending} className="ug-btn ug-btn-primary">
          {isPending ? 'Saving…' : mode === 'create' ? 'Continue → add photos' : 'Save changes'}
        </button>
        {mode === 'edit' && (
          <button
            type="button"
            className="ug-btn ug-btn-ghost"
            onClick={() => router.push('/market/mine')}
          >
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
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      {children}
    </div>
  );
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
