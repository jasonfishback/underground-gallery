// components/me/MeView.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import AddCarWizard from '@/components/garage/AddCarWizard';
import { colors, fonts } from '@/lib/design';

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
  modGains?: Record<string, { hp: number; tq: number }>;
};

export function MeView({ cars, modCounts, modGains }: Props) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div>
      {/* Action bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          className="ug-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.4em',
            color: colors.accent,
            fontWeight: 700,
          }}
        >
          // {cars.length} {cars.length === 1 ? 'VEHICLE' : 'VEHICLES'}
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="ug-btn ug-btn-primary"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Car list */}
      {cars.length === 0 ? (
        <div
          className="ug-card"
          style={{
            padding: 48,
            textAlign: 'center',
            color: colors.textMuted,
            fontFamily: fonts.mono,
            fontSize: 12,
            letterSpacing: '0.18em',
          }}
        >
          NO VEHICLES YET. ADD ONE TO START RACING.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {cars.map((c) => {
            const label = `${c.year} ${c.make} ${c.model}${c.trim ? ' ' + c.trim : ''}`;
            const modCount = modCounts[c.id] ?? 0;
            return (
              <Link
                key={c.id}
                href={`/v/${c.id}`}
                className="ug-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  textDecoration: 'none',
                  color: colors.text,
                }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${colors.border}`,
                    borderRadius: 10,
                    flexShrink: 0,
                    backgroundImage: c.thumbUrl ? `url(${c.thumbUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="ug-mono"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      marginBottom: 4,
                    }}
                  >
                    {label.toUpperCase()}
                  </div>
                  <div
                    className="ug-mono"
                    style={{
                      fontSize: 10,
                      color: colors.textMuted,
                      letterSpacing: '0.15em',
                    }}
                  >
                    {c.stockHp ? `${c.stockHp + (modGains?.[c.id]?.hp ?? 0)} HP` : ''}
                    {(c.stockTorque ?? 0) + (modGains?.[c.id]?.tq ?? 0) > 0
                      ? ` • ${(c.stockTorque ?? 0) + (modGains?.[c.id]?.tq ?? 0)} TQ`
                      : ''}
                    {c.drivetrain ? ` • ${c.drivetrain}` : ''}
                    {modCount > 0 ? ` • ${modCount} MOD${modCount === 1 ? '' : 'S'}` : ''}
                  </div>
                </div>
                {c.isPrimary && (
                  <div
                    className="ug-mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.25em',
                      color: colors.accent,
                      fontWeight: 700,
                    }}
                  >
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
