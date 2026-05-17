// lib/race/calculator.ts
//
// Race simulation math. ALL functions in this module are pure — no DB
// access, no I/O — so they can be unit-tested in isolation and reused
// from server actions, route handlers, or server components.
//
// IMPORTANT: every output is an *estimate*. We surface this in the UI
// with a permanent disclaimer. Real-world race outcomes depend on
// driver, weather, surface, gearing, and many things we don't model.

// ── Types ─────────────────────────────────────────────────────────────────

export type Drivetrain = 'AWD' | 'RWD' | 'FWD' | '4WD' | 'UNKNOWN';
export type Transmission = 'Manual' | 'Auto' | 'DCT' | 'CVT' | 'UNKNOWN';
export type TireType = 'DragRadial' | 'Performance' | 'AllSeason' | 'Eco' | 'Unknown';

export type RaceType =
  | 'zero_sixty'
  | 'quarter_mile'
  | 'half_mile'
  | 'roll_40_140'
  | 'highway_pull'
  | 'dig'
  | 'overall';

/** Inputs to the race calculator. Already merged across stock specs + mods. */
export type RaceCar = {
  /** Display name, just for the summary text. */
  label: string;
  /** Modified or stock horsepower (whp not assumed). */
  hp: number;
  /** Modified or stock torque, lb-ft. */
  torque: number;
  /** Curb weight in pounds. */
  weight: number;
  drivetrain: Drivetrain;
  transmission: Transmission;
  tireType: TireType;
  /** Driver skill 1-10, defaults to 5. Optional. */
  driverSkill?: number;
  /**
   * Mod-derived bonuses. Each is added to the base modifier for that race
   * factor. Negative values are allowed (e.g., a bigger turbo with more lag
   * could subtract from launch).
   */
  modBonuses?: {
    traction?: number;
    launch?: number;
    shift?: number;
    handling?: number;
  };
};

export type RaceResult = {
  challengerScore: number;
  opponentScore: number;
  challengerEt: number | null;
  opponentEt: number | null;
  challengerTrap: number | null;
  opponentTrap: number | null;
  winner: 'challenger' | 'opponent' | 'tie';
  /** Seconds. Positive = winner ahead by this much. */
  estimatedGap: number;
  summary: string;
  /** Full per-car derived numbers — useful for debugging and UI. */
  details: {
    challenger: RaceCarDerived;
    opponent: RaceCarDerived;
  };
};

export type RaceCarDerived = {
  powerToWeight: number;
  torqueToWeight: number;
  launchScore: number;
  tractionScore: number;
  shiftScore: number;
  aeroScore: number;
  estimatedQuarterMile: number;
  estimatedTrapSpeed: number;
  estimatedZeroToSixty: number;
  /** Estimated unrestricted top speed (mph). Not what the car does in a 1/4 mile.
   *  Empirical ratio of trap × 1.45 with a mild HP boost — lands within ~10%
   *  of real-world unrestricted top speeds for sport/muscle cars. */
  estimatedTopSpeed: number;
};

// ── Multipliers ───────────────────────────────────────────────────────────

const DRIVETRAIN_LAUNCH: Record<Drivetrain, number> = {
  AWD: 1.12,
  '4WD': 1.08,
  RWD: 1.0,
  FWD: 0.94,
  UNKNOWN: 1.0,
};

const TRANSMISSION_SHIFT: Record<Transmission, number> = {
  DCT: 1.06,
  Auto: 1.04,
  Manual: 1.0,
  CVT: 0.96,
  UNKNOWN: 1.0,
};

const TIRE_TRACTION: Record<TireType, number> = {
  DragRadial: 1.1,
  Performance: 1.05,
  AllSeason: 1.0,
  Eco: 0.94,
  Unknown: 1.0,
};

// FWD penalty grows with HP — a 200hp FWD car is fine, a 500hp FWD car can't
// put power down. We model this as a piecewise penalty applied to launch.
function fwdHighPowerPenalty(hp: number): number {
  if (hp < 250) return 0;
  if (hp < 350) return -0.04;
  if (hp < 450) return -0.10;
  return -0.18;
}

// ── Score components ──────────────────────────────────────────────────────

function powerToWeight(car: RaceCar): number {
  if (car.weight <= 0) return 0;
  return car.hp / car.weight;
}

function torqueToWeight(car: RaceCar): number {
  if (car.weight <= 0) return 0;
  return car.torque / car.weight;
}

function launchScore(car: RaceCar): number {
  let score = DRIVETRAIN_LAUNCH[car.drivetrain] ?? 1.0;
  if (car.drivetrain === 'FWD') score += fwdHighPowerPenalty(car.hp);
  score += (car.modBonuses?.launch ?? 0) / 100;
  return Math.max(0.5, score);
}

function tractionScore(car: RaceCar): number {
  let score = TIRE_TRACTION[car.tireType] ?? 1.0;
  score += (car.modBonuses?.traction ?? 0) / 100;
  return Math.max(0.5, score);
}

function shiftScore(car: RaceCar): number {
  let score = TRANSMISSION_SHIFT[car.transmission] ?? 1.0;
  score += (car.modBonuses?.shift ?? 0) / 100;
  return Math.max(0.5, score);
}

function aeroScore(car: RaceCar): number {
  // Aero bonus from mods. Default 1.0 — most road cars are roughly a wash
  // up to 130-140 mph, which is where it starts mattering.
  return 1.0 + (car.modBonuses?.handling ?? 0) / 200;
}

function driverSkillBonus(car: RaceCar): number {
  // Skill is 1-10. Centered at 5. Each step is ~1% performance swing.
  const s = Math.max(1, Math.min(10, car.driverSkill ?? 5));
  return 1.0 + (s - 5) * 0.01;
}

// ── ET / trap-speed estimates ─────────────────────────────────────────────

/**
 * Quarter-mile elapsed time estimate. Based on the classic Hale formula:
 *   ET = 5.825 * (weight / hp) ^ (1/3)
 * Then adjusted by drivetrain, tire, transmission, and skill.
 */
export function estimateQuarterMile(car: RaceCar): number {
  if (car.hp <= 0 || car.weight <= 0) return 0;
  const baseEt = 5.825 * Math.pow(car.weight / car.hp, 1 / 3);

  // Smaller multipliers than the launch/shift bonuses themselves —
  // a 12% AWD launch advantage doesn't translate to 12% better ET.
  const launchAdj = 1 - (launchScore(car) - 1) * 0.5;
  const tractionAdj = 1 - (tractionScore(car) - 1) * 0.4;
  const shiftAdj = 1 - (shiftScore(car) - 1) * 0.3;
  const skillAdj = 1 / driverSkillBonus(car);

  return baseEt * launchAdj * tractionAdj * shiftAdj * skillAdj;
}

/**
 * Trap speed estimate (mph at end of quarter-mile).
 *   trap = 234 * (hp / weight) ^ (1/3)
 */
export function estimateTrapSpeed(car: RaceCar): number {
  if (car.hp <= 0 || car.weight <= 0) return 0;
  return 234 * Math.pow(car.hp / car.weight, 1 / 3);
}

/**
 * Estimated unrestricted top speed (mph). Trap speed × ratio that grows
 * slightly with horsepower (more HP overcomes drag past trap). Capped at
 * sane values for show-friendly numbers.
 */
export function estimateTopSpeed(car: RaceCar): number {
  const trap = estimateTrapSpeed(car);
  if (trap <= 0) return 0;
  // Aero mods (lower drag) push the ratio up; high-HP push it up; AWD slightly down.
  const aeroFactor = 1 + (car.modBonuses?.handling ?? 0) / 600;
  const hpFactor = 1 + Math.min(0.15, Math.max(-0.05, (car.hp - 300) / 4000));
  const drivetrainFactor = car.drivetrain === 'AWD' || car.drivetrain === '4WD' ? 0.97 : 1.0;
  const top = trap * 1.42 * aeroFactor * hpFactor * drivetrainFactor;
  // Hard rails so a typo doesn't show 400 mph
  return Math.max(70, Math.min(240, top));
}

/**
 * 0-60 estimate. Derived from quarter-mile ET — a reasonable rule of thumb
 * is 0-60 ≈ ET * 0.36 to 0.40 depending on drivetrain.
 */
export function estimateZeroToSixty(car: RaceCar): number {
  const et = estimateQuarterMile(car);
  if (et <= 0) return 0;
  // AWD cars hit 60 closer to 0.36 of their ET, FWD/RWD closer to 0.40.
  const ratio =
    car.drivetrain === 'AWD' || car.drivetrain === '4WD'
      ? 0.36
      : car.drivetrain === 'FWD'
        ? 0.40
        : 0.38;
  return et * ratio;
}

// ── Score functions for each race type ────────────────────────────────────

function digRaceScore(car: RaceCar): number {
  // From a stop, weighted toward power-to-weight + launch.
  return (
    powerToWeight(car) * 1000 * 45 +
    torqueToWeight(car) * 1000 * 25 +
    launchScore(car) * 15 +
    tractionScore(car) * 10 +
    shiftScore(car) * 5
  ) * driverSkillBonus(car);
}

function rollRaceScore(car: RaceCar): number {
  // From a roll, launch matters less, weight and aero matter more.
  return (
    powerToWeight(car) * 1000 * 60 +
    torqueToWeight(car) * 1000 * 20 +
    shiftScore(car) * 10 +
    aeroScore(car) * 5 +
    tractionScore(car) * 5
  ) * driverSkillBonus(car);
}

function quarterMileScore(car: RaceCar): number {
  // Inverse of ET — lower ET = higher score
  const et = estimateQuarterMile(car);
  return et > 0 ? 1000 / et : 0;
}

function halfMileScore(car: RaceCar): number {
  // Heavily weighted to top-end pull. Power-to-weight dominates.
  return (
    powerToWeight(car) * 1000 * 70 +
    shiftScore(car) * 8 +
    aeroScore(car) * 12 +
    torqueToWeight(car) * 1000 * 10
  ) * driverSkillBonus(car);
}

function highwayPullScore(car: RaceCar): number {
  // Like half-mile but emphasizing torque/aero for sustained pull
  return (
    powerToWeight(car) * 1000 * 65 +
    torqueToWeight(car) * 1000 * 15 +
    aeroScore(car) * 15 +
    shiftScore(car) * 5
  ) * driverSkillBonus(car);
}

function zeroSixtyScore(car: RaceCar): number {
  // 0-60 is launch + first-gear pull. Drivetrain dominates more here.
  const z = estimateZeroToSixty(car);
  return z > 0 ? 1000 / z : 0;
}

function overallScore(car: RaceCar): number {
  // Average of all race types — represents general capability
  return (
    digRaceScore(car) * 0.20 +
    rollRaceScore(car) * 0.20 +
    quarterMileScore(car) * 0.20 +
    halfMileScore(car) * 0.15 +
    highwayPullScore(car) * 0.10 +
    zeroSixtyScore(car) * 0.15
  );
}

// ── Public API ────────────────────────────────────────────────────────────

export function getRaceScore(car: RaceCar, raceType: RaceType): number {
  switch (raceType) {
    case 'dig':
      return digRaceScore(car);
    case 'roll_40_140':
      return rollRaceScore(car);
    case 'quarter_mile':
      return quarterMileScore(car);
    case 'half_mile':
      return halfMileScore(car);
    case 'highway_pull':
      return highwayPullScore(car);
    case 'zero_sixty':
      return zeroSixtyScore(car);
    case 'overall':
      return overallScore(car);
  }
}

export function deriveCar(car: RaceCar): RaceCarDerived {
  return {
    powerToWeight: powerToWeight(car),
    torqueToWeight: torqueToWeight(car),
    launchScore: launchScore(car),
    tractionScore: tractionScore(car),
    shiftScore: shiftScore(car),
    aeroScore: aeroScore(car),
    estimatedQuarterMile: estimateQuarterMile(car),
    estimatedTrapSpeed: estimateTrapSpeed(car),
    estimatedZeroToSixty: estimateZeroToSixty(car),
    estimatedTopSpeed: estimateTopSpeed(car),
  };
}

/**
 * Run a race between two cars. Returns a full result with summary text.
 */
export function runRace(
  challenger: RaceCar,
  opponent: RaceCar,
  raceType: RaceType,
): RaceResult {
  const cScore = getRaceScore(challenger, raceType);
  const oScore = getRaceScore(opponent, raceType);

  const cET = ['quarter_mile', 'dig'].includes(raceType)
    ? estimateQuarterMile(challenger)
    : null;
  const oET = ['quarter_mile', 'dig'].includes(raceType)
    ? estimateQuarterMile(opponent)
    : null;
  const cTrap = ['quarter_mile', 'dig', 'half_mile'].includes(raceType)
    ? estimateTrapSpeed(challenger)
    : null;
  const oTrap = ['quarter_mile', 'dig', 'half_mile'].includes(raceType)
    ? estimateTrapSpeed(opponent)
    : null;

  let winner: 'challenger' | 'opponent' | 'tie';
  if (Math.abs(cScore - oScore) < 0.5) winner = 'tie';
  else if (cScore > oScore) winner = 'challenger';
  else winner = 'opponent';

  // Estimated gap: scaled difference in scores. We tune this so results
  // feel realistic — typical drag-strip gaps are 0.1-2.5 seconds.
  const scoreDiff = Math.abs(cScore - oScore);
  const denominator = Math.max(cScore, oScore, 1);
  const estimatedGap = Math.min(5, (scoreDiff / denominator) * 6);

  return {
    challengerScore: cScore,
    opponentScore: oScore,
    challengerEt: cET,
    opponentEt: oET,
    challengerTrap: cTrap,
    opponentTrap: oTrap,
    winner,
    estimatedGap,
    summary: buildSummary(challenger, opponent, raceType, winner, estimatedGap, cScore, oScore),
    details: {
      challenger: deriveCar(challenger),
      opponent: deriveCar(opponent),
    },
  };
}

// ── Summary text generation ───────────────────────────────────────────────

function buildSummary(
  challenger: RaceCar,
  opponent: RaceCar,
  raceType: RaceType,
  winner: 'challenger' | 'opponent' | 'tie',
  gap: number,
  cScore: number,
  oScore: number,
): string {
  const cP2W = powerToWeight(challenger);
  const oP2W = powerToWeight(opponent);

  const raceLabel: Record<RaceType, string> = {
    zero_sixty: '0–60 sprint',
    quarter_mile: 'quarter-mile',
    half_mile: 'half-mile',
    roll_40_140: '40–140 roll race',
    highway_pull: 'highway pull',
    dig: 'standing-start dig race',
    overall: 'overall comparison',
  };

  if (winner === 'tie') {
    return `Dead heat. The ${challenger.label} and ${opponent.label} are evenly matched in this ${raceLabel[raceType]} — too close to call.`;
  }

  const winnerCar = winner === 'challenger' ? challenger : opponent;
  const loserCar = winner === 'challenger' ? opponent : challenger;
  const winnerP2W = winner === 'challenger' ? cP2W : oP2W;
  const loserP2W = winner === 'challenger' ? oP2W : cP2W;
  const gapText = gap < 0.2 ? 'a fender' : `${gap.toFixed(1)} seconds`;

  // Why-they-won reasoning
  const reasons: string[] = [];

  if (winnerP2W > loserP2W * 1.05) {
    reasons.push('a stronger power-to-weight ratio');
  } else if (winnerP2W < loserP2W * 0.95) {
    // Won despite worse P2W — must be drivetrain/launch
    if (winnerCar.drivetrain === 'AWD' && loserCar.drivetrain !== 'AWD') {
      reasons.push('a much stronger AWD launch');
    } else if (
      winnerCar.tireType === 'DragRadial' &&
      loserCar.tireType !== 'DragRadial'
    ) {
      reasons.push('superior traction off the line with drag radials');
    } else {
      reasons.push('better launch and traction');
    }
  }

  if (
    raceType === 'roll_40_140' &&
    TRANSMISSION_SHIFT[winnerCar.transmission] >
      TRANSMISSION_SHIFT[loserCar.transmission]
  ) {
    reasons.push('faster shifts');
  }

  if (raceType === 'dig' && winnerCar.drivetrain === 'AWD' && loserCar.drivetrain !== 'AWD') {
    reasons.push('the AWD advantage off the line');
  }

  if (
    (raceType === 'half_mile' || raceType === 'highway_pull') &&
    winnerCar.weight < loserCar.weight * 0.92
  ) {
    reasons.push('a significant weight advantage');
  }

  if (reasons.length === 0) {
    reasons.push('a small but consistent edge across the board');
  }

  const reasonText = reasons.length === 1
    ? reasons[0]
    : reasons.slice(0, -1).join(', ') + ', and ' + reasons[reasons.length - 1];

  return `The ${winnerCar.label} wins the ${raceLabel[raceType]} by ${gapText}. ${winnerCar.label} had ${reasonText}.`;
}
