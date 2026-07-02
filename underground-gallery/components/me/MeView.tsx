// components/me/MeView.tsx
//
// The garage grid — big hero-photo cards instead of skinny rows. Each card
// leads with the car's photo (or a "give it a face" prompt), shows the
// nickname + Y/M/M, and a stat strip (HP / drivetrain / mods / log entries).
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
  name: string | null;
  isPrimary: boolean;
  heroUrl: string | null;
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
  buildCounts?: Record<string, number>;
};

export function MeView({ cars, modCounts, modGains, buildCounts }: Props) {
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

      {/* Garage grid */}
      {cars.length === 0 ? (
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          style={{
            width: '100%',
            padding: '64px 24px',
            background: 'rgba(255,42,42,0.04)',
            border: `2px dashed ${colors.accentBorder}`,
            borderRadius: 16,
            color: colors.text,
            cursor: 'pointer',
            textAlign: 'center',
            fontFamily: fonts.sans,
          }}
        >
          <div style={{ fontSize: 34, marginBottom: 12 }}>🏁</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            Your garage is empty
          </div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>
            Add your first car — search takes 10 seconds, photos optional.
          </div>
        </button>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 16,
          }}
        >
          {cars.map((c) => {
            const ymm = `${c.year} ${c.make} ${c.model}${c.trim ? ' ' + c.trim : ''}`;
            const displayName = c.name || ymm;
            const modCount = modCounts[c.id] ?? 0;
            const logCount = buildCounts?.[c.id] ?? 0;
            const hp = c.currentHpOverride
              ?? (c.stockHp != null ? c.stockHp + (modGains?.[c.id]?.hp ?? 0) : null);

            return (
              <Link
                key={c.id}
                href={`/v/${c.id}`}
                className="ug-card"
                style={{
                  display: 'block',
                  padding: 0,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: colors.text,
                }}
              >
                {/* Hero image */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    background: c.heroUrl
                      ? undefined
                      : 'radial-gradient(80% 100% at 50% 0%, rgba(255,42,42,0.10), rgba(255,255,255,0.02) 70%)',
                    backgroundImage: c.heroUrl ? `url(${c.heroUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!c.heroUrl && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 26, opacity: 0.9 }}>📸</span>
                      <span
                        className="ug-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.3em',
                          color: colors.textMuted,
                          fontWeight: 700,
                        }}
                      >
                        NO PHOTO — GIVE IT A FACE
                      </span>
                    </div>
                  )}

                  {/* Bottom gradient + name overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: '28px 16px 12px',
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2,
                        textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayName}
                    </div>
                    {c.name && (
                      <div
                        className="ug-mono"
                        style={{
                          fontSize: 9.5,
                          letterSpacing: '0.18em',
                          color: 'rgba(245,246,247,0.75)',
                          marginTop: 3,
                          textTransform: 'uppercase',
                        }}
                      >
                        {ymm}
                      </div>
                    )}
                  </div>

                  {c.isPrimary && (
                    <div
                      className="ug-mono"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: colors.accent,
                        color: '#0a0a0a',
                        padding: '3px 9px',
                        borderRadius: 4,
                        fontSize: 8.5,
                        fontWeight: 700,
                        letterSpacing: '0.25em',
                        boxShadow: '0 2px 10px rgba(255,42,42,0.5)',
                      }}
                    >
                      ★ PRIMARY
                    </div>
                  )}
                </div>

                {/* Stat strip */}
                <div
                  className="ug-mono"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 16px',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    color: colors.textMuted,
                    borderTop: `1px solid ${colors.border}`,
                    flexWrap: 'wrap',
                  }}
                >
                  {hp != null && (
                    <span style={{ color: colors.accent, fontWeight: 700 }}>
                      {hp} HP
                    </span>
                  )}
                  {c.drivetrain && <span>{c.drivetrain}</span>}
                  <span>
                    {modCount} MOD{modCount === 1 ? '' : 'S'}
                  </span>
                  <span style={{ marginLeft: 'auto', color: logCount > 0 ? colors.textMuted : colors.textDim }}>
                    {logCount > 0
                      ? `${logCount} LOG ${logCount === 1 ? 'ENTRY' : 'ENTRIES'}`
                      : 'NO LOG YET'}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Add-vehicle tile */}
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            style={{
              minHeight: 200,
              borderRadius: 12,
              border: '2px dashed rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.015)',
              color: colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontFamily: fonts.mono,
              transition: 'border-color 140ms ease, color 140ms ease',
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.3em' }}>
              ADD VEHICLE
            </span>
          </button>
        </div>
      )}

      <AddCarWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
