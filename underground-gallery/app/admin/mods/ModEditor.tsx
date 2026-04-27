'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createMod, updateMod, toggleModActive } from './actions';
import { colors, fonts } from '@/lib/design';

const CATEGORIES = [
  'Tune', 'Turbo', 'Intake', 'Exhaust', 'Downpipes', 'Headers',
  'Fuel', 'Intercooler', 'Transmission', 'Tires', 'Suspension',
  'Brakes', 'WeightReduction', 'Aero', 'Drivetrain', 'Custom',
];

type Mod = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  defaultHpGain: number;
  defaultTorqueGain: number;
  defaultWeightChange: number;
  active: boolean;
};

export function ModEditor({ mods }: { mods: Mod[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <button
        onClick={() => { setAdding(true); setEditingId(null); }}
        disabled={adding || pending}
        style={btn(colors.accent, '#0a0a0a')}
      >
        + ADD MOD
      </button>

      {adding && (
        <ModForm
          onSubmit={(d) => {
            start(async () => {
              const res = await createMod(d);
              if (!res.ok) alert(res.error);
              else { setAdding(false); router.refresh(); }
            });
          }}
          onCancel={() => setAdding(false)}
          pending={pending}
        />
      )}

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mods.map((m) => (
          <div key={m.id} style={{
            padding: 12,
            border: `0.5px solid ${colors.border}`,
            background: m.active ? colors.bgElevated : 'transparent',
            opacity: m.active ? 1 : 0.5,
          }}>
            {editingId === m.id ? (
              <ModForm
                initial={m}
                onSubmit={(d) => {
                  start(async () => {
                    const res = await updateMod({ ...d, id: m.id });
                    if (!res.ok) alert(res.error);
                    else { setEditingId(null); router.refresh(); }
                  });
                }}
                onCancel={() => setEditingId(null)}
                pending={pending}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 12, alignItems: 'center' }}>
                <span style={{
                  fontFamily: fonts.mono,
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  color: colors.textMuted,
                  fontWeight: 700,
                  minWidth: 90,
                }}>
                  {m.category.toUpperCase()}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                  {m.description && (
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      {m.description}
                    </div>
                  )}
                </div>
                <span style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  color: m.defaultHpGain > 0 ? colors.accent : colors.textDim,
                }}>
                  {m.defaultHpGain > 0 ? '+' : ''}{m.defaultHpGain} hp
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setEditingId(m.id); setAdding(false); }}
                    disabled={pending}
                    style={btn('transparent', colors.text, true)}
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(m.active ? 'Disable this mod? Existing user mods keep working.' : 'Re-enable this mod?')) return;
                      start(async () => {
                        const res = await toggleModActive(m.id, !m.active);
                        if (!res.ok) alert(res.error);
                        else router.refresh();
                      });
                    }}
                    disabled={pending}
                    style={btn('transparent', m.active ? colors.danger : colors.success, true)}
                  >
                    {m.active ? 'DISABLE' : 'ENABLE'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModForm({
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  initial?: Partial<Mod>;
  onSubmit: (d: { category: string; name: string; description?: string; defaultHpGain?: number; defaultTorqueGain?: number; defaultWeightChange?: number; }) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [category, setCategory] = useState(initial?.category ?? 'Intake');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [hp, setHp] = useState(String(initial?.defaultHpGain ?? 0));
  const [tq, setTq] = useState(String(initial?.defaultTorqueGain ?? 0));
  const [wt, setWt] = useState(String(initial?.defaultWeightChange ?? 0));

  return (
    <div style={{
      padding: 16,
      border: `0.5px solid ${colors.accent}`,
      background: colors.bgElevated,
      marginTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <Field label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inp}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} style={inp} placeholder="e.g. Stage 1 ECU Tune" />
      </Field>
      <Field label="Description">
        <input value={description ?? ''} onChange={(e) => setDescription(e.target.value)} style={inp} placeholder="optional" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Field label="HP Gain">
          <input type="number" value={hp} onChange={(e) => setHp(e.target.value)} style={inp} />
        </Field>
        <Field label="Torque Gain">
          <input type="number" value={tq} onChange={(e) => setTq(e.target.value)} style={inp} />
        </Field>
        <Field label="Weight Change">
          <input type="number" value={wt} onChange={(e) => setWt(e.target.value)} style={inp} />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => onSubmit({
            category,
            name,
            description: description || undefined,
            defaultHpGain: parseInt(hp, 10) || 0,
            defaultTorqueGain: parseInt(tq, 10) || 0,
            defaultWeightChange: parseInt(wt, 10) || 0,
          })}
          disabled={pending}
          style={btn(colors.accent, '#0a0a0a')}
        >
          {pending ? 'SAVING...' : 'SAVE'}
        </button>
        <button onClick={onCancel} disabled={pending} style={btn('transparent', colors.textMuted, true)}>
          CANCEL
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{
        fontSize: 9,
        letterSpacing: '0.3em',
        color: colors.textMuted,
        fontFamily: fonts.mono,
        fontWeight: 700,
        marginBottom: 4,
      }}>
        {label.toUpperCase()}
      </div>
      {children}
    </label>
  );
}

const inp: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: colors.bg,
  border: `0.5px solid ${colors.border}`,
  color: colors.text,
  fontSize: 13,
  fontFamily: fonts.sans,
  boxSizing: 'border-box',
};

function btn(bg: string, fg: string, outline = false): React.CSSProperties {
  return {
    padding: '8px 16px',
    background: bg,
    color: fg,
    border: outline ? `0.5px solid ${fg}` : 'none',
    fontFamily: fonts.mono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.3em',
    cursor: 'pointer',
  };
}