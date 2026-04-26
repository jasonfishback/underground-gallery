// components/garage/AddCarWizard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addCarFromSpec,
  addCarFromManual,
  decodeVin,
} from '@/app/garage/actions';
import { styles, colors, fonts } from '@/lib/design';

type Method = 'search' | 'vin' | 'manual';

type Trim = {
  key: string;
  name: string;
  specs?: {
    stockHp: number | null;
    stockTorque: number | null;
    curbWeight: number | null;
    drivetrain: string | null;
    transmission: string | null;
    engine: string | null;
  };
};

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export function AddCarWizard({ onClose, onCreated }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'method' | 'choose' | 'fillin' | 'name'>('method');
  const [method, setMethod] = useState<Method>('search');

  // Search-mode state
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [makes, setMakes] = useState<{ id: string; name: string }[]>([]);
  const [make, setMake] = useState<string>('');
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [model, setModel] = useState<string>('');
  const [trims, setTrims] = useState<Trim[]>([]);
  const [chosenTrim, setChosenTrim] = useState<Trim | null>(null);

  // VIN state
  const [vin, setVin] = useState('');

  // Manual specs state
  const [manual, setManual] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    trim: '',
    engine: '',
    displacement: '',
    transmission: '' as '' | 'Manual' | 'Auto' | 'DCT' | 'CVT' | 'Other',
    drivetrain: '' as '' | 'AWD' | 'RWD' | 'FWD' | '4WD',
    aspiration: '' as '' | 'NA' | 'Turbo' | 'Supercharged' | 'TwinTurbo' | 'EV' | 'Hybrid' | 'Other',
    stockHp: '' as number | '',
    stockTorque: '' as number | '',
    curbWeight: '' as number | '',
  });

  const [vinAttachment, setVinAttachment] = useState('');
  const [color, setColor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load years on mount
  useEffect(() => {
    fetch('/api/vehicle-data?op=years')
      .then((r) => r.json())
      .then((d) => setYears(d.years ?? []))
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    if (!year) {
      setMakes([]);
      return;
    }
    fetch(`/api/vehicle-data?op=makes&year=${year}`)
      .then((r) => r.json())
      .then((d) => setMakes(d.makes ?? []))
      .catch(() => setMakes([]));
  }, [year]);

  useEffect(() => {
    if (!year || !make) {
      setModels([]);
      return;
    }
    fetch(`/api/vehicle-data?op=models&year=${year}&make=${encodeURIComponent(make)}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => setModels([]));
  }, [year, make]);

  useEffect(() => {
    if (!year || !make || !model) {
      setTrims([]);
      return;
    }
    fetch(
      `/api/vehicle-data?op=trims&year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    )
      .then((r) => r.json())
      .then((d) => setTrims(d.trims ?? []))
      .catch(() => setTrims([]));
  }, [year, make, model]);

  async function handleVinDecode() {
    setError(null);
    setSubmitting(true);
    const r = await decodeVin(vin);
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    const d = (r as { ok: true; data: any }).data?.data;
    if (!d) {
      setError('VIN decoded but no usable fields returned');
      return;
    }
    setManual({
      year: d.year ?? manual.year,
      make: d.make ?? '',
      model: d.model ?? '',
      trim: d.trim ?? '',
      engine: d.engine ?? '',
      displacement: d.displacement ?? '',
      transmission:
        d.transmission?.toLowerCase().includes('manual') ? 'Manual'
        : d.transmission?.toLowerCase().includes('dct') ? 'DCT'
        : d.transmission?.toLowerCase().includes('cvt') ? 'CVT'
        : d.transmission?.toLowerCase().includes('auto') ? 'Auto'
        : '',
      drivetrain:
        d.drivetrain?.toUpperCase().includes('AWD') ? 'AWD'
        : d.drivetrain?.toUpperCase().includes('RWD') ? 'RWD'
        : d.drivetrain?.toUpperCase().includes('FWD') ? 'FWD'
        : d.drivetrain?.toUpperCase().includes('4WD') ? '4WD'
        : '',
      aspiration: '',
      stockHp: '',
      stockTorque: '',
      curbWeight: '',
    });
    setVinAttachment(vin);
    setStep('fillin');
  }

  function chooseTrim(t: Trim) {
    setChosenTrim(t);
    if (t.specs?.stockHp && t.specs?.curbWeight) {
      // Cache hit with usable data — go straight to naming
      setStep('name');
    } else {
      // Cache miss; fall through to manual fill-in pre-filled with what we have
      setManual({
        year: year!,
        make,
        model,
        trim: t.name,
        engine: t.specs?.engine ?? '',
        displacement: '',
        transmission: '' as any,
        drivetrain: '' as any,
        aspiration: '' as any,
        stockHp: t.specs?.stockHp ?? '',
        stockTorque: t.specs?.stockTorque ?? '',
        curbWeight: t.specs?.curbWeight ?? '',
      });
      setStep('fillin');
    }
  }

  async function submitFromSpec() {
    if (!chosenTrim) return;
    setSubmitting(true);
    setError(null);
    const r = await addCarFromSpec({
      vehicleSpecId: chosenTrim.key,
      vin: vinAttachment || undefined,
      color: color || undefined,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    onCreated();
  }

  async function submitFromManual() {
    setSubmitting(true);
    setError(null);
    const r = await addCarFromManual({
      manualSpecs: {
        year: manual.year,
        make: manual.make,
        model: manual.model,
        trim: manual.trim,
        engine: manual.engine || undefined,
        displacement: manual.displacement || undefined,
        transmission: manual.transmission || undefined,
        drivetrain: manual.drivetrain || undefined,
        aspiration: manual.aspiration || undefined,
        stockHp: manual.stockHp === '' ? undefined : Number(manual.stockHp),
        stockTorque: manual.stockTorque === '' ? undefined : Number(manual.stockTorque),
        curbWeight: manual.curbWeight === '' ? undefined : Number(manual.curbWeight),
      },
      vin: vinAttachment || undefined,
      color: color || undefined,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    onCreated();
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
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: colors.bg,
          border: `0.5px solid ${colors.border}`,
          padding: 32,
          maxWidth: 640,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.4em',
            color: colors.accent,
            marginBottom: 8,
          }}
        >
          ADD VEHICLE //{' '}
          {step === 'method' && 'STEP 1 OF 4'}
          {step === 'choose' && 'STEP 2 OF 4'}
          {step === 'fillin' && 'STEP 3 OF 4'}
          {step === 'name' && 'STEP 4 OF 4'}
        </div>
        <h2 style={{ fontSize: 22, margin: '0 0 24px', letterSpacing: '0.05em' }}>
          {step === 'method' && 'How do you want to add it?'}
          {step === 'choose' && 'Pick the trim'}
          {step === 'fillin' && 'Fill in the specs'}
          {step === 'name' && 'Confirm'}
        </h2>

        {step === 'method' && (
          <MethodStep
            method={method}
            setMethod={setMethod}
            year={year}
            setYear={setYear}
            years={years}
            make={make}
            setMake={setMake}
            makes={makes}
            model={model}
            setModel={setModel}
            models={models}
            vin={vin}
            setVin={setVin}
            onContinue={() => {
              if (method === 'search') {
                if (year && make && model) setStep('choose');
                else setError('Select year, make, and model');
              } else if (method === 'vin') {
                handleVinDecode();
              } else {
                setStep('fillin');
              }
            }}
            submitting={submitting}
          />
        )}

        {step === 'choose' && (
          <ChooseStep
            trims={trims}
            onChoose={chooseTrim}
            onSkip={() => setStep('fillin')}
            onBack={() => setStep('method')}
          />
        )}

        {step === 'fillin' && (
          <FillinStep
            manual={manual}
            setManual={setManual}
            onContinue={() => setStep('name')}
            onBack={() => setStep(method === 'search' ? 'choose' : 'method')}
          />
        )}

        {step === 'name' && (
          <NameStep
            chosenTrim={chosenTrim}
            manual={manual}
            color={color}
            setColor={setColor}
            onSubmit={() => (chosenTrim ? submitFromSpec() : submitFromManual())}
            onBack={() => setStep(chosenTrim ? 'choose' : 'fillin')}
            submitting={submitting}
          />
        )}

        {error && (
          <div
            style={{
              padding: '10px 14px',
              border: `0.5px solid ${colors.accent}`,
              color: colors.accent,
              fontSize: 12,
              marginTop: 16,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step components ───────────────────────────────────────────────────────

function MethodStep({
  method,
  setMethod,
  year,
  setYear,
  years,
  make,
  setMake,
  makes,
  model,
  setModel,
  models,
  vin,
  setVin,
  onContinue,
  submitting,
}: any) {
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['search', 'vin', 'manual'] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            style={{
              flex: 1,
              padding: '12px',
              background: method === m ? colors.accentSoft : 'transparent',
              border: `0.5px solid ${method === m ? colors.accentBorder : colors.border}`,
              color: method === m ? colors.accent : colors.textMuted,
              fontFamily: fonts.mono,
              fontSize: 11,
              letterSpacing: '0.2em',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {m === 'search' && 'YEAR/MAKE/MODEL'}
            {m === 'vin' && 'DECODE VIN'}
            {m === 'manual' && 'MANUAL ENTRY'}
          </button>
        ))}
      </div>

      {method === 'search' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={styles.label}>Year</label>
            <select
              value={year ?? ''}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
              style={styles.input}
            >
              <option value="">Select year…</option>
              {years.map((y: number) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={styles.label}>Make</label>
            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              disabled={!year}
              style={{ ...styles.input, opacity: !year ? 0.4 : 1 }}
            >
              <option value="">Select make…</option>
              {makes.map((m: any) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={styles.label}>Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make}
              style={{ ...styles.input, opacity: !make ? 0.4 : 1 }}
            >
              <option value="">Select model…</option>
              {models.map((m: any) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {method === 'vin' && (
        <div>
          <label style={styles.label}>VIN</label>
          <input
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="17-character VIN"
            maxLength={17}
            style={styles.input}
          />
          <div style={{ fontSize: 11, color: colors.textDim, marginTop: 6 }}>
            We use NHTSA to decode engine, drivetrain, and basics. You'll fill in
            HP / torque / weight on the next step.
          </div>
        </div>
      )}

      {method === 'manual' && (
        <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>
          Don't see your car or VIN doesn't decode? You can enter all the specs
          yourself. We'll save them to a community database so the next user
          with the same car gets a cache hit.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button
          onClick={onContinue}
          disabled={submitting}
          style={{ ...styles.buttonPrimary, opacity: submitting ? 0.5 : 1 }}
        >
          {submitting ? 'WORKING…' : 'CONTINUE →'}
        </button>
      </div>
    </>
  );
}

function ChooseStep({
  trims,
  onChoose,
  onSkip,
  onBack,
}: {
  trims: Trim[];
  onChoose: (t: Trim) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <>
      {trims.length === 0 ? (
        <div style={{ ...styles.panel, color: colors.textMuted, fontSize: 13 }}>
          We don't have any trims for this combination yet. Continue with manual
          entry — your specs will help future users.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {trims.map((t) => (
            <button
              key={t.key}
              onClick={() => onChoose(t)}
              style={{
                padding: 14,
                background: 'transparent',
                border: `0.5px solid ${colors.border}`,
                color: colors.text,
                fontFamily: fonts.mono,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>
                {t.specs?.engine && <span>{t.specs.engine}</span>}
                {t.specs?.stockHp && <span> · {t.specs.stockHp} hp</span>}
                {t.specs?.curbWeight && <span> · {t.specs.curbWeight.toLocaleString()} lb</span>}
                {t.specs?.drivetrain && <span> · {t.specs.drivetrain}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={styles.buttonGhost}>
          ← BACK
        </button>
        <button onClick={onSkip} style={styles.buttonGhost}>
          MY TRIM ISN'T LISTED
        </button>
      </div>
    </>
  );
}

function FillinStep({ manual, setManual, onContinue, onBack }: any) {
  const set = (k: string, v: any) => setManual({ ...manual, [k]: v });
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={styles.label}>Year</label>
          <input
            type="number"
            value={manual.year}
            onChange={(e) => set('year', Number(e.target.value))}
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Make</label>
          <input value={manual.make} onChange={(e) => set('make', e.target.value)} style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>Model</label>
          <input value={manual.model} onChange={(e) => set('model', e.target.value)} style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>Trim</label>
          <input value={manual.trim} onChange={(e) => set('trim', e.target.value)} style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>Engine</label>
          <input
            value={manual.engine}
            onChange={(e) => set('engine', e.target.value)}
            placeholder="e.g. Twin-turbo I6"
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Displacement</label>
          <input
            value={manual.displacement}
            onChange={(e) => set('displacement', e.target.value)}
            placeholder="e.g. 3.0L"
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Drivetrain</label>
          <select value={manual.drivetrain} onChange={(e) => set('drivetrain', e.target.value)} style={styles.input}>
            <option value="">—</option>
            <option value="RWD">RWD</option>
            <option value="FWD">FWD</option>
            <option value="AWD">AWD</option>
            <option value="4WD">4WD</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>Transmission</label>
          <select value={manual.transmission} onChange={(e) => set('transmission', e.target.value)} style={styles.input}>
            <option value="">—</option>
            <option value="Manual">Manual</option>
            <option value="Auto">Auto</option>
            <option value="DCT">DCT</option>
            <option value="CVT">CVT</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>Aspiration</label>
          <select value={manual.aspiration} onChange={(e) => set('aspiration', e.target.value)} style={styles.input}>
            <option value="">—</option>
            <option value="NA">Naturally Aspirated</option>
            <option value="Turbo">Turbo</option>
            <option value="TwinTurbo">Twin Turbo</option>
            <option value="Supercharged">Supercharged</option>
            <option value="EV">EV</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>Stock HP</label>
          <input
            type="number"
            value={manual.stockHp}
            onChange={(e) => set('stockHp', e.target.value === '' ? '' : Number(e.target.value))}
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Stock Torque (lb-ft)</label>
          <input
            type="number"
            value={manual.stockTorque}
            onChange={(e) => set('stockTorque', e.target.value === '' ? '' : Number(e.target.value))}
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Curb Weight (lb)</label>
          <input
            type="number"
            value={manual.curbWeight}
            onChange={(e) => set('curbWeight', e.target.value === '' ? '' : Number(e.target.value))}
            style={styles.input}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <button onClick={onBack} style={styles.buttonGhost}>
          ← BACK
        </button>
        <button onClick={onContinue} style={styles.buttonPrimary}>
          CONTINUE →
        </button>
      </div>
    </>
  );
}

function NameStep({ chosenTrim, manual, color, setColor, onSubmit, onBack, submitting }: any) {
  const display = chosenTrim
    ? `${manual.year || ''} ${manual.make || ''} ${manual.model || ''} ${chosenTrim.name}`
    : `${manual.year} ${manual.make} ${manual.model} ${manual.trim}`;
  return (
    <>
      <div style={{ ...styles.panel, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: colors.textMuted, marginBottom: 6 }}>
          ADDING
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{display.trim()}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={styles.label}>Color (optional)</label>
        <input value={color} onChange={(e) => setColor(e.target.value)} style={styles.input} placeholder="e.g. Yas Marina Blue" />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={styles.buttonGhost}>
          ← BACK
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          style={{ ...styles.buttonPrimary, opacity: submitting ? 0.5 : 1 }}
        >
          {submitting ? 'CREATING…' : 'CREATE GARAGE ENTRY'}
        </button>
      </div>
    </>
  );
}
