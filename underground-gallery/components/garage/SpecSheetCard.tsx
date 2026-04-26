// components/garage/SpecSheetCard.tsx
//
// Displays a vehicle's stock spec sheet with current modified numbers
// alongside. Pure presentation — receives a pre-calculated BuildSummary.

import { styles, colors } from '@/lib/design';
import type { BuildSummary } from '@/lib/race/build';

type Props = {
  label: string;
  build: BuildSummary;
  /** Estimated 0-60 / quarter-mile from the race calculator. Optional. */
  estimates?: {
    zeroToSixty: number;
    quarterMile: number;
    trapSpeed: number;
  };
};

export function SpecSheetCard({ label, build, estimates }: Props) {
  const Row = ({
    label,
    stock,
    current,
    unit,
    delta,
  }: {
    label: string;
    stock: string | number | null;
    current: string | number | null;
    unit?: string;
    delta?: number | null;
  }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr',
        gap: 8,
        padding: '8px 0',
        borderBottom: `0.5px solid ${colors.border}`,
        fontSize: 12,
      }}
    >
      <div style={{ color: colors.textMuted, letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ color: colors.textDim }}>
        {stock != null ? `${stock}${unit ? ' ' + unit : ''}` : '—'}
      </div>
      <div style={{ color: colors.text, fontWeight: 700 }}>
        {current != null ? `${current}${unit ? ' ' + unit : ''}` : '—'}
      </div>
      <div
        style={{
          color: delta && delta !== 0
            ? (delta > 0 ? colors.success : colors.accent)
            : colors.textDim,
          textAlign: 'right',
        }}
      >
        {delta != null && delta !== 0
          ? `${delta > 0 ? '+' : ''}${delta}`
          : ''}
      </div>
    </div>
  );

  return (
    <div style={styles.panel}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.4em',
          color: colors.accent,
          marginBottom: 8,
        }}
      >
        SPEC SHEET
      </div>
      <h3 style={{ fontSize: 18, margin: '0 0 16px', letterSpacing: '0.05em' }}>{label}</h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr',
          gap: 8,
          padding: '6px 0',
          fontSize: 9,
          letterSpacing: '0.3em',
          color: colors.textDim,
          borderBottom: `0.5px solid ${colors.borderStrong}`,
        }}
      >
        <div></div>
        <div>STOCK</div>
        <div>CURRENT</div>
        <div style={{ textAlign: 'right' }}>Δ</div>
      </div>

      <Row label="Horsepower" stock={build.stockHp || null} current={build.currentHp || null} unit="hp" delta={build.totalHpGain} />
      <Row label="Torque" stock={build.stockTorque || null} current={build.currentTorque || null} unit="lb-ft" delta={build.totalTorqueGain} />
      <Row label="Weight" stock={build.stockWeight || null} current={build.currentWeight || null} unit="lb" delta={build.totalWeightChange} />
      <Row
        label="Power-to-Weight"
        stock={build.stockHp && build.stockWeight ? (build.stockWeight / build.stockHp).toFixed(2) : null}
        current={build.currentHp && build.currentWeight ? (build.currentWeight / build.currentHp).toFixed(2) : null}
        unit="lb/hp"
      />
      <Row label="Drivetrain" stock={build.drivetrain} current={build.drivetrain} />
      <Row label="Transmission" stock={build.transmission} current={build.transmission} />
      <Row label="Tires" stock="—" current={build.tireType} />

      {estimates && (
        <>
          <div
            style={{
              marginTop: 16,
              fontSize: 10,
              letterSpacing: '0.4em',
              color: colors.textMuted,
              paddingBottom: 6,
              borderBottom: `0.5px solid ${colors.borderStrong}`,
            }}
          >
            PERFORMANCE ESTIMATES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: '12px 0' }}>
            <Stat label="0–60" value={estimates.zeroToSixty.toFixed(1)} unit="sec" />
            <Stat label="¼ Mile" value={estimates.quarterMile.toFixed(1)} unit="sec" />
            <Stat label="Trap Speed" value={estimates.trapSpeed.toFixed(0)} unit="mph" />
          </div>
          <div style={{ fontSize: 10, color: colors.textDim, marginTop: 4 }}>
            Estimates assume average conditions. Real results vary with weather, surface, gearing, and driver.
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: '0.3em', color: colors.textDim, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>
        {value}
        <span style={{ fontSize: 11, marginLeft: 4, color: colors.textMuted }}>{unit}</span>
      </div>
    </div>
  );
}
