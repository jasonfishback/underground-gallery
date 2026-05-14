// components/market/GarageLinkPicker.tsx
//
// Optional dropdown that auto-fills the car listing form from one of the
// seller's garage vehicles.

'use client';

import { useState } from 'react';
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

type Props = {
  vehicles: GarageVehicle[];
  onPick: (v: GarageVehicle | null) => void;
};

export function GarageLinkPicker({ vehicles, onPick }: Props) {
  const [chosen, setChosen] = useState<string>('');
  if (vehicles.length === 0) return null;

  return (
    <div
      className="ug-glass-tinted"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 14,
      }}
    >
      <label
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          color: '#ff8585',
          fontFamily: fonts.mono,
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
        className="ug-input"
      >
        <option value="">— Don't link —</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.year} {v.make} {v.model}
            {v.trim ? ` ${v.trim}` : ''}
          </option>
        ))}
      </select>
      <div style={{ fontSize: 11, color: colors.textMuted }}>
        Linking pulls in your build sheet, mods, photos, and dyno numbers.
      </div>
    </div>
  );
}
