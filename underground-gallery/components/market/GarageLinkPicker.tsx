// components/market/GarageLinkPicker.tsx
//
// Optional dropdown that auto-fills the car listing form from one of the
// seller's garage vehicles.

'use client';

import { useState } from 'react';

type GarageVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  vin: string | null;
};

type Props = {
  vehicles: GarageVehicle[];
  onPick: (v: GarageVehicle | null) => void;
};

export function GarageLinkPicker({ vehicles, onPick }: Props) {
  const [chosen, setChosen] = useState<string>('');
  if (vehicles.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: 'rgba(255,42,42,0.08)',
        border: '1px solid rgba(255,42,42,0.25)',
        borderRadius: 10,
        padding: 14,
      }}
    >
      <label
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          color: '#ff8585',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 700,
        }}
      >
        AUTO-FILL FROM YOUR GARAGE
      </label>
      <select
        value={chosen}
        onChange={(e) => {
          setChosen(e.target.value);
          const v = vehicles.find((x) => x.id === e.target.value) ?? null;
          onPick(v);
        }}
        style={{
          background: '#0a0c12',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 14,
          fontFamily: "'Inter Tight', system-ui, sans-serif",
        }}
      >
        <option value="">— Don't link —</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.year} {v.make} {v.model}
            {v.trim ? ` ${v.trim}` : ''}
          </option>
        ))}
      </select>
      <div style={{ fontSize: 11, color: 'rgba(245,246,247,0.55)' }}>
        Linking pulls in your build sheet, mods, photos, and dyno numbers.
      </div>
    </div>
  );
}
