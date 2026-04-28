// components/me/MeView.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import AddCarWizard from '@/components/garage/AddCarWizard';
import { styles, colors, fonts } from '@/lib/design';

type Car = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  isPrimary: boolean;
  thumbUrl: string | null;
  stockHp: number | null;
  stockTorque: number | null;
  curbWeight: number | null;
  drivetrain: string | null;
  transmission: string | null;
  currentHpOverride: number | null;
  currentTorqueOverride: number | null;
  currentWeightOverride: number | null;
  tireType: string | null;
  driverSkill: number | null;
};

type Props = {
  userId: string;
  cars: Car[];
  modCounts: Record<string, number>;
  modHpGains?: Record<string, number>;
};

export function MeView({ cars, modCounts, modHpGains }: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div>
      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, fontFamily: fonts.mono, fontWeight: 700 }}>
          {cars.length} {cars.length === 1 ? 'VEHICLE' : 'VEHICLES'}
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          style={{
            ...styles.buttonPrimary,
            padding: '12px 24px',
            fontSize: 11,
            letterSpacing: '0.3em',
          }}
        >
          + ADD VEHICLE
        </button>
      </div>

      {/* Car list */}
      {cars.length === 0 ? (
        <div style={{
          padding: 48,
          border: `1px dashed ${colors.border}`,
          textAlign: 'center',
          color: colors.textMuted,
          fontFamily: fonts.mono,
          fontSize: 12,
          letterSpacing: '0.1em',
        }}>
          NO VEHICLES YET. ADD ONE TO START RACING.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {cars.map((c) => {
            const label = `${c.year} ${c.make} ${c.model}${c.trim ? ' ' + c.trim : ''}`;
            const modCount = modCounts[c.id] ?? 0;
            return (
              <Link
                key={c.id}
                href={`/v/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  border: `1px solid ${colors.border}`,
                  background: colors.bgElevated,
                  textDecoration: 'none',
                  color: colors.text,
                }}
              >
                <div style={{
                  width: 80,
                  height: 80,
                  background: colors.bgSubtle,
                  border: `1px solid ${colors.border}`,
                  flexShrink: 0,
                  backgroundImage: c.thumbUrl ? `url(${c.thumbUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                    {label.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted, letterSpacing: '0.15em' }}>
                    {c.stockHp ? `${c.stockHp + (modHpGains?.[c.id] ?? 0)} HP` : ''}{c.drivetrain ? ` • ${c.drivetrain}` : ''}{modCount > 0 ? ` • ${modCount} MOD${modCount === 1 ? '' : 'S'}` : ''}
                  </div>
                </div>
                {c.isPrimary && (
                  <div style={{
                    fontSize: 9,
                    letterSpacing: '0.25em',
                    color: colors.accent,
                    fontFamily: fonts.mono,
                    fontWeight: 700,
                  }}>
                    ★ PRIMARY
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <AddCarWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}