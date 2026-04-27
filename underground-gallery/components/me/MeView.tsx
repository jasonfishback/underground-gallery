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
};

export function MeView({ cars, modCounts }: Props) {
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
          }}
        >
          + ADD VEHICLE
        </button>
      </div>

      {cars.length === 0 ? (
        <div style={{ ...styles.panel, textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 16 }}>
            No vehicles yet. Add your first car to start racing.
          </div>
          <button onClick={() => setWizardOpen(true)} style={styles.buttonPrimary}>
            + ADD YOUR FIRST CAR
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {cars.map((c) => (
            <CarCard key={c.id} car={c} modCount={modCounts[c.id] ?? 0} />
          ))}
        </div>
      )}

      {wizardOpen && (
        <AddCarWizard
          onClose={() => setWizardOpen(false)}
          onCreated={() => {
            setWizardOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function CarCard({ car, modCount }: { car: Car; modCount: number }) {
  const currentHp = car.currentHpOverride ?? car.stockHp;
  const hasMods = modCount > 0 || car.currentHpOverride !== null;

  return (
    <Link
      href={`/v/${car.id}`}
      style={{
        position: 'relative',
        background: '#111',
        border: `0.5px solid ${car.isPrimary ? colors.accent : colors.border}`,
        textDecoration: 'none',
        color: colors.text,
        display: 'block',
        overflow: 'hidden',
      }}
    >
      {car.isPrimary && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
            fontSize: 8,
            letterSpacing: '0.3em',
            color: colors.accent,
            border: `0.5px solid ${colors.accent}`,
            padding: '2px 8px',
            fontFamily: fonts.mono,
            fontWeight: 700,
            background: 'rgba(10,10,10,0.8)',
          }}
        >
          PRIMARY
        </div>
      )}

      {/* Photo or placeholder */}
      <div
        style={{
          aspectRatio: '16 / 9',
          background: car.thumbUrl ? `url(${car.thumbUrl}) center/cover` : '#0d0d0d',
          borderBottom: `0.5px solid ${colors.border}`,
        }}
      />

      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.02em', marginBottom: 4 }}>
          {car.year} {car.make} {car.model}
        </div>
        {car.trim && (
          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12, fontFamily: fonts.mono }}>
            {car.trim}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, fontFamily: fonts.mono, color: colors.textMuted }}>
          {currentHp != null && (
            <div>
              <span style={{ color: hasMods ? colors.accent : colors.text, fontSize: 14, fontWeight: 700 }}>
                {currentHp}
              </span>
              <span style={{ marginLeft: 2 }}>hp</span>
            </div>
          )}
          {car.drivetrain && <div>{car.drivetrain}</div>}
          {car.transmission && <div>{car.transmission}</div>}
          {modCount > 0 && (
            <div style={{ marginLeft: 'auto', color: colors.accent }}>
              {modCount} {modCount === 1 ? 'MOD' : 'MODS'}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
