// components/garage/ModList.tsx
'use client';

import { useState } from 'react';
import { addModFromCatalog, addCustomMod, deleteMod, updateMod } from '@/app/garage/actions';
import { styles, colors, fonts } from '@/lib/design';

type Mod = {
  id: string;
  modCatalogId: string | null;
  customName: string | null;
  category: string;
  hpGain: number | null;
  torqueGain: number | null;
  weightChange: number | null;
  verified: boolean;
  notes: string | null;
};

type CatalogPreset = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  defaultHpGain: number | null;
  defaultTorqueGain: number | null;
  defaultWeightChange: number | null;
  displayOrder: number;
};

type Props = {
  vehicleId: string;
  mods: Mod[];
  catalog: CatalogPreset[];
  /** Display only — no edit controls. For viewing other people's cars. */
  readOnly?: boolean;
};

export function ModList({ vehicleId, mods, catalog, readOnly = false }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function handleDelete(modId: string) {
    if (!confirm('Remove this mod?')) return;
    setBusy(modId);
    await deleteMod(modId);
    setBusy(null);
  }

  async function handleToggleVerified(mod: Mod) {
    setBusy(mod.id);
    await updateMod({ modId: mod.id, verified: !mod.verified });
    setBusy(null);
  }

  // Group by category for display
  const byCategory = new Map<string, Mod[]>();
  for (const m of mods) {
    const list = byCategory.get(m.category) ?? [];
    list.push(m);
    byCategory.set(m.category, list);
  }

  return (
    <div style={styles.panel}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, marginBottom: 4 }}>
            MODIFICATIONS
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            {mods.length} {mods.length === 1 ? 'mod' : 'mods'}
            {!readOnly && ' · click to edit'}
          </div>
        </div>
        {!readOnly && (
          <button onClick={() => setShowAddModal(true)} style={styles.buttonPrimary}>
            + ADD MOD
          </button>
        )}
      </div>

      {mods.length === 0 ? (
        <div style={{ color: colors.textMuted, fontSize: 13, padding: '24px 0' }}>
          {readOnly ? 'No mods listed.' : 'No mods yet. Add tunes, intake, exhaust, anything that affects performance.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 4 }}>
          {[...byCategory.entries()].map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  color: colors.textDim,
                  padding: '6px 0',
                  borderBottom: `0.5px solid ${colors.borderStrong}`,
                  marginBottom: 4,
                }}
              >
                {cat.toUpperCase()}
              </div>
              {items.map((m) => {
                const preset = catalog.find((c) => c.id === m.modCatalogId);
                const name = m.customName ?? preset?.name ?? '(unnamed)';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: `0.5px solid ${colors.border}`,
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: colors.text, fontWeight: 600 }}>
                        {name}
                        {m.verified && (
                          <span
                            style={{
                              fontSize: 8,
                              letterSpacing: '0.2em',
                              color: colors.success,
                              border: `0.5px solid ${colors.success}`,
                              padding: '2px 5px',
                              marginLeft: 8,
                              fontFamily: fonts.mono,
                            }}
                          >
                            DYNO ✓
                          </span>
                        )}
                      </div>
                      {m.notes && (
                        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>{m.notes}</div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        fontSize: 11,
                        fontFamily: fonts.mono,
                        color: colors.textMuted,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {(m.hpGain ?? 0) !== 0 && <span>{(m.hpGain ?? 0) > 0 ? '+' : ''}{m.hpGain}hp</span>}
                      {(m.torqueGain ?? 0) !== 0 && <span>{(m.torqueGain ?? 0) > 0 ? '+' : ''}{m.torqueGain}lb-ft</span>}
                      {(m.weightChange ?? 0) !== 0 && <span>{(m.weightChange ?? 0) > 0 ? '+' : ''}{m.weightChange}lb</span>}
                    </div>
                    {!readOnly && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleToggleVerified(m)}
                          disabled={busy === m.id}
                          title={m.verified ? 'Unmark as dyno-verified' : 'Mark as dyno-verified'}
                          style={{
                            background: 'transparent',
                            border: `0.5px solid ${m.verified ? colors.success : colors.border}`,
                            color: m.verified ? colors.success : colors.textDim,
                            padding: '4px 8px',
                            fontSize: 9,
                            letterSpacing: '0.2em',
                            cursor: 'pointer',
                            fontFamily: fonts.mono,
                          }}
                        >
                          {m.verified ? '✓' : 'DYNO?'}
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={busy === m.id}
                          style={{
                            background: 'transparent',
                            border: `0.5px solid ${colors.border}`,
                            color: colors.accent,
                            padding: '4px 10px',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddModModal
          vehicleId={vehicleId}
          catalog={catalog}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ── AddModModal ──────────────────────────────────────────────────────────

function AddModModal({
  vehicleId,
  catalog,
  onClose,
}: {
  vehicleId: string;
  catalog: CatalogPreset[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'preset' | 'custom'>('preset');
  const [search, setSearch] = useState('');
  const [chosenPreset, setChosenPreset] = useState<CatalogPreset | null>(null);
  const [hpOverride, setHpOverride] = useState('');
  const [torqueOverride, setTorqueOverride] = useState('');
  const [weightOverride, setWeightOverride] = useState('');
  const [verified, setVerified] = useState(false);
  const [notes, setNotes] = useState('');

  // Custom mod state
  const [custom, setCustom] = useState({
    customName: '',
    category: 'Custom' as
      | 'Tune' | 'Turbo' | 'Intake' | 'Exhaust' | 'Downpipes' | 'Headers' | 'Fuel'
      | 'Intercooler' | 'Transmission' | 'Tires' | 'Suspension' | 'Brakes'
      | 'WeightReduction' | 'Aero' | 'Drivetrain' | 'Custom',
    hpGain: 0,
    torqueGain: 0,
    weightChange: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = catalog.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered by category
  const grouped = new Map<string, CatalogPreset[]>();
  for (const p of filtered) {
    const list = grouped.get(p.category) ?? [];
    list.push(p);
    grouped.set(p.category, list);
  }

  async function submitPreset() {
    if (!chosenPreset) return;
    setSubmitting(true);
    setError(null);
    const r = await addModFromCatalog({
      vehicleId,
      modCatalogId: chosenPreset.id,
      hpGain: hpOverride === '' ? undefined : Number(hpOverride),
      torqueGain: torqueOverride === '' ? undefined : Number(torqueOverride),
      weightChange: weightOverride === '' ? undefined : Number(weightOverride),
      verified,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    onClose();
  }

  async function submitCustom() {
    if (!custom.customName.trim()) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    const r = await addCustomMod({
      vehicleId,
      customName: custom.customName,
      category: custom.category,
      hpGain: custom.hpGain,
      torqueGain: custom.torqueGain,
      weightChange: custom.weightChange,
      tractionModifier: 0,
      launchModifier: 0,
      shiftModifier: 0,
      handlingModifier: 0,
      reliabilityModifier: 0,
      verified: false,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    onClose();
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: colors.bg,
          border: `0.5px solid ${colors.border}`,
          padding: 32,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, marginBottom: 8 }}>
          ADD MODIFICATION
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          <button
            onClick={() => setTab('preset')}
            style={{
              flex: 1,
              padding: '10px',
              background: tab === 'preset' ? colors.accentSoft : 'transparent',
              border: `0.5px solid ${tab === 'preset' ? colors.accentBorder : colors.border}`,
              color: tab === 'preset' ? colors.accent : colors.textMuted,
              fontFamily: fonts.mono,
              fontSize: 10,
              letterSpacing: '0.2em',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            FROM CATALOG
          </button>
          <button
            onClick={() => setTab('custom')}
            style={{
              flex: 1,
              padding: '10px',
              background: tab === 'custom' ? colors.accentSoft : 'transparent',
              border: `0.5px solid ${tab === 'custom' ? colors.accentBorder : colors.border}`,
              color: tab === 'custom' ? colors.accent : colors.textMuted,
              fontFamily: fonts.mono,
              fontSize: 10,
              letterSpacing: '0.2em',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            CUSTOM
          </button>
        </div>

        {tab === 'preset' && (
          <>
            {!chosenPreset ? (
              <>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search mods…"
                  style={{ ...styles.input, marginBottom: 16 }}
                />
                <div style={{ display: 'grid', gap: 4, maxHeight: 400, overflowY: 'auto' }}>
                  {[...grouped.entries()].map(([cat, items]) => (
                    <div key={cat} style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.3em',
                          color: colors.textDim,
                          padding: '6px 0',
                          borderBottom: `0.5px solid ${colors.borderStrong}`,
                          marginBottom: 4,
                        }}
                      >
                        {cat.toUpperCase()}
                      </div>
                      {items.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setChosenPreset(p)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 12px',
                            background: 'transparent',
                            border: `0.5px solid ${colors.border}`,
                            color: colors.text,
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: fonts.mono,
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                            <span style={{ fontSize: 10, color: colors.textMuted }}>
                              {(p.defaultHpGain ?? 0) !== 0 && `+${p.defaultHpGain}hp`}
                              {(p.defaultTorqueGain ?? 0) !== 0 && ` +${p.defaultTorqueGain}lb-ft`}
                              {(p.defaultWeightChange ?? 0) !== 0 && ` ${(p.defaultWeightChange ?? 0) > 0 ? '+' : ''}${p.defaultWeightChange}lb`}
                            </span>
                          </div>
                          {p.description && (
                            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>
                              {p.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ ...styles.panel, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.3em', color: colors.textMuted, marginBottom: 4 }}>
                    SELECTED
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{chosenPreset.name}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>
                    Default: +{chosenPreset.defaultHpGain ?? 0}hp / +{chosenPreset.defaultTorqueGain ?? 0}lb-ft
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={styles.label}>HP gain (override)</label>
                    <input
                      type="number"
                      value={hpOverride}
                      onChange={(e) => setHpOverride(e.target.value)}
                      placeholder={`${chosenPreset.defaultHpGain ?? 0}`}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Torque (override)</label>
                    <input
                      type="number"
                      value={torqueOverride}
                      onChange={(e) => setTorqueOverride(e.target.value)}
                      placeholder={`${chosenPreset.defaultTorqueGain ?? 0}`}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Weight (override)</label>
                    <input
                      type="number"
                      value={weightOverride}
                      onChange={(e) => setWeightOverride(e.target.value)}
                      placeholder={`${chosenPreset.defaultWeightChange ?? 0}`}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Notes (optional)</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Shop name, tune number, dyno result, etc."
                    style={styles.input}
                  />
                </div>

                <label
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: 12,
                    color: colors.textMuted,
                    marginBottom: 16,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                  />
                  Dyno-verified gains
                </label>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setChosenPreset(null)} style={styles.buttonGhost}>
                    ← BACK TO LIST
                  </button>
                  <button
                    onClick={submitPreset}
                    disabled={submitting}
                    style={{ ...styles.buttonPrimary, opacity: submitting ? 0.5 : 1 }}
                  >
                    {submitting ? 'ADDING…' : 'ADD MOD'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'custom' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Mod name *</label>
              <input
                value={custom.customName}
                onChange={(e) => setCustom({ ...custom, customName: e.target.value })}
                placeholder="e.g. Garrett G35-900 turbo + custom manifold"
                style={styles.input}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Category</label>
              <select
                value={custom.category}
                onChange={(e) => setCustom({ ...custom, category: e.target.value as any })}
                style={styles.input}
              >
                {['Tune', 'Turbo', 'Intake', 'Exhaust', 'Downpipes', 'Headers', 'Fuel',
                  'Intercooler', 'Transmission', 'Tires', 'Suspension', 'Brakes',
                  'WeightReduction', 'Aero', 'Drivetrain', 'Custom'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={styles.label}>HP gain</label>
                <input
                  type="number"
                  value={custom.hpGain}
                  onChange={(e) => setCustom({ ...custom, hpGain: Number(e.target.value) || 0 })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Torque gain</label>
                <input
                  type="number"
                  value={custom.torqueGain}
                  onChange={(e) => setCustom({ ...custom, torqueGain: Number(e.target.value) || 0 })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Weight change</label>
                <input
                  type="number"
                  value={custom.weightChange}
                  onChange={(e) => setCustom({ ...custom, weightChange: Number(e.target.value) || 0 })}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={styles.buttonGhost}>
                CANCEL
              </button>
              <button
                onClick={submitCustom}
                disabled={submitting}
                style={{ ...styles.buttonPrimary, opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? 'ADDING…' : 'ADD CUSTOM MOD'}
              </button>
            </div>
          </>
        )}

        {error && (
          <div style={{ padding: '10px 14px', border: `0.5px solid ${colors.accent}`, color: colors.accent, fontSize: 12, marginTop: 16 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
