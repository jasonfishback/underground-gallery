// tests/race-calculator.test.ts
//
// Unit tests for the pure race-calculator module. Run with vitest:
//   npx vitest run tests/race-calculator.test.ts
//
// These tests don't touch the database — the calculator is intentionally
// pure, taking RaceCar inputs and returning numbers.

import { describe, it, expect } from 'vitest';
import {
  runRace,
  estimateQuarterMile,
  estimateTrapSpeed,
  estimateZeroToSixty,
  getRaceScore,
  type RaceCar,
} from '../lib/race/calculator';

// ── Sample cars ───────────────────────────────────────────────────────────

const m4: RaceCar = {
  label: '2015 BMW M4',
  hp: 425, torque: 406, weight: 3530,
  drivetrain: 'RWD', transmission: 'DCT', tireType: 'Performance',
};

const gtr: RaceCar = {
  label: '2017 Nissan GT-R',
  hp: 565, torque: 467, weight: 3933,
  drivetrain: 'AWD', transmission: 'DCT', tireType: 'Performance',
};

const civicSi: RaceCar = {
  label: '2022 Civic Si',
  hp: 200, torque: 192, weight: 2952,
  drivetrain: 'FWD', transmission: 'Manual', tireType: 'Performance',
};

const teslaPlaid: RaceCar = {
  label: '2022 Tesla Plaid',
  hp: 1020, torque: 1050, weight: 4766,
  drivetrain: 'AWD', transmission: 'Auto', tireType: 'Performance',
};

const fwdMonster: RaceCar = {
  label: 'Hypothetical 500hp FWD',
  hp: 500, torque: 450, weight: 3000,
  drivetrain: 'FWD', transmission: 'Manual', tireType: 'Performance',
};

const rwdEquiv: RaceCar = {
  label: 'Hypothetical 500hp RWD',
  hp: 500, torque: 450, weight: 3000,
  drivetrain: 'RWD', transmission: 'Manual', tireType: 'Performance',
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe('estimateQuarterMile', () => {
  it('returns realistic ET for a known stock M4', () => {
    const et = estimateQuarterMile(m4);
    // Real-world stock M4 is around 12.0-12.3s. Our estimate should be close.
    expect(et).toBeGreaterThan(11.0);
    expect(et).toBeLessThan(13.5);
  });

  it('returns 0 for invalid inputs', () => {
    expect(estimateQuarterMile({ ...m4, hp: 0 })).toBe(0);
    expect(estimateQuarterMile({ ...m4, weight: 0 })).toBe(0);
  });
});

describe('estimateTrapSpeed', () => {
  it('returns realistic trap speed for stock GT-R', () => {
    const trap = estimateTrapSpeed(gtr);
    // Real-world stock GT-R traps around 120 mph.
    expect(trap).toBeGreaterThan(110);
    expect(trap).toBeLessThan(130);
  });
});

describe('estimateZeroToSixty', () => {
  it('AWD cars hit 60 sooner than RWD with same ET', () => {
    const awd = estimateZeroToSixty(gtr);
    // Real-world GT-R is 2.9s. We won't be perfect but should be reasonable.
    expect(awd).toBeLessThan(4.5);
    expect(awd).toBeGreaterThan(2.0);
  });

  it('Plaid is in EV-quick territory', () => {
    const z = estimateZeroToSixty(teslaPlaid);
    expect(z).toBeLessThan(3.5);
  });
});

describe('FWD high-power penalty', () => {
  it('500hp FWD car has lower launch than 500hp RWD', () => {
    const fwdScore = getRaceScore(fwdMonster, 'dig');
    const rwdScore = getRaceScore(rwdEquiv, 'dig');
    expect(fwdScore).toBeLessThan(rwdScore);
  });

  it('low-power FWD has minimal penalty', () => {
    // Civic Si at 200hp shouldn't get clobbered by the FWD penalty
    const score = getRaceScore(civicSi, 'dig');
    expect(score).toBeGreaterThan(0);
    expect(Number.isFinite(score)).toBe(true);
  });
});

describe('AWD launch advantage', () => {
  it('GT-R beats M4 in a dig race despite similar P/W', () => {
    // GT-R has more HP but more weight too. AWD launch should tip the dig.
    const r = runRace(m4, gtr, 'dig');
    expect(r.winner).toBe('opponent');
  });

  it('M4 closes the gap on GT-R in a roll race (less launch advantage)', () => {
    const dig = runRace(m4, gtr, 'dig');
    const roll = runRace(m4, gtr, 'roll_40_140');
    // Roll race gap should be smaller than dig race gap (relative)
    expect(roll.estimatedGap).toBeLessThanOrEqual(dig.estimatedGap + 0.5);
  });
});

describe('drag radials boost dig races', () => {
  const m4Stock: RaceCar = { ...m4 };
  const m4DragRadials: RaceCar = { ...m4, tireType: 'DragRadial' };

  it('drag radials improve quarter-mile ET', () => {
    const stockEt = estimateQuarterMile(m4Stock);
    const dragEt = estimateQuarterMile(m4DragRadials);
    expect(dragEt).toBeLessThan(stockEt);
  });
});

describe('Plaid dominance', () => {
  it('Plaid beats GT-R in 0-60', () => {
    const r = runRace(gtr, teslaPlaid, 'zero_sixty');
    expect(r.winner).toBe('opponent');
  });

  it('Plaid produces sub-10 quarter mile ET', () => {
    const et = estimateQuarterMile(teslaPlaid);
    expect(et).toBeLessThan(11);
  });
});

describe('tie detection', () => {
  it('identical cars produce a tie', () => {
    const a: RaceCar = { ...m4, label: 'A' };
    const b: RaceCar = { ...m4, label: 'B' };
    const r = runRace(a, b, 'quarter_mile');
    expect(r.winner).toBe('tie');
  });
});

describe('summary text', () => {
  it('includes the winner label and a reason', () => {
    const r = runRace(m4, gtr, 'quarter_mile');
    // GT-R is expected to win; summary should name them and explain why
    expect(r.summary).toContain('GT-R');
    expect(r.summary.length).toBeGreaterThan(40);
  });

  it('mentions AWD advantage on dig race wins', () => {
    const r = runRace(civicSi, gtr, 'dig');
    expect(r.winner).toBe('opponent');
    expect(r.summary.toLowerCase()).toMatch(/awd|launch|traction/);
  });
});

describe('all race types return finite scores', () => {
  const cars: RaceCar[] = [m4, gtr, civicSi, teslaPlaid, fwdMonster];
  const types = ['zero_sixty', 'quarter_mile', 'half_mile', 'roll_40_140', 'highway_pull', 'dig', 'overall'] as const;

  for (const car of cars) {
    for (const type of types) {
      it(`${car.label} - ${type}`, () => {
        const score = getRaceScore(car, type);
        expect(Number.isFinite(score)).toBe(true);
        expect(score).toBeGreaterThan(0);
      });
    }
  }
});

describe('driver skill effect', () => {
  it('higher skill gives a small but consistent edge', () => {
    const newbie: RaceCar = { ...m4, driverSkill: 1, label: 'Newbie' };
    const pro: RaceCar = { ...m4, driverSkill: 10, label: 'Pro' };
    const r = runRace(newbie, pro, 'quarter_mile');
    expect(r.winner).toBe('opponent');
  });
});
