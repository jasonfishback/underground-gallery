// lib/validation/race.ts
//
// Validation schemas for stage 3 inputs.

import { z } from 'zod';

const currentYear = new Date().getFullYear();

// ── Vehicle/spec ──────────────────────────────────────────────────────────

export const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(11, 'VIN too short')
  .max(17, 'VIN too long')
  .regex(/^[A-HJ-NPR-Z0-9]+$/, 'Invalid VIN characters');

export const drivetrainSchema = z.enum(['AWD', 'RWD', 'FWD', '4WD']);
export const transmissionSchema = z.enum(['Manual', 'Auto', 'DCT', 'CVT', 'Other']);
export const aspirationSchema = z.enum(['NA', 'Turbo', 'Supercharged', 'TwinTurbo', 'EV', 'Hybrid', 'Other']);
export const tireTypeSchema = z.enum(['DragRadial', 'Performance', 'AllSeason', 'Eco', 'Unknown']);

export const manualSpecsSchema = z.object({
  year: z.number().int().min(1900).max(currentYear + 2),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  trim: z.string().trim().max(60).default(''),
  bodyStyle: z.string().trim().max(60).optional().or(z.literal('')),
  engine: z.string().trim().max(120).optional().or(z.literal('')),
  displacement: z.string().trim().max(20).optional().or(z.literal('')),
  aspiration: aspirationSchema.optional(),
  fuelType: z.string().trim().max(40).optional().or(z.literal('')),
  transmission: transmissionSchema.optional(),
  drivetrain: drivetrainSchema.optional(),
  stockHp: z.number().int().min(0).max(3000).optional(),
  stockTorque: z.number().int().min(0).max(3000).optional(),
  curbWeight: z.number().int().min(500).max(15000).optional(),
  zeroToSixty: z.number().min(1).max(30).optional(),
  quarterMile: z.number().min(5).max(30).optional(),
  topSpeed: z.number().int().min(50).max(400).optional(),
});
export type ManualSpecsInput = z.infer<typeof manualSpecsSchema>;

/** Optional nickname for the car ("Daily", "Track Rat", "Project E36"). */
export const carNameSchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .or(z.literal(''));

export const addCarFromSpecSchema = z.object({
  vehicleSpecId: z.string().min(1),
  /** Optional VIN; not validated against the spec. */
  vin: vinSchema.optional(),
  color: z.string().trim().max(40).optional().or(z.literal('')),
  name: carNameSchema,
});

export const addCarFromManualSchema = z.object({
  manualSpecs: manualSpecsSchema,
  vin: vinSchema.optional(),
  color: z.string().trim().max(40).optional().or(z.literal('')),
  name: carNameSchema,
});

// ── Mods ──────────────────────────────────────────────────────────────────

export const modCategorySchema = z.enum([
  'Tune', 'Turbo', 'Intake', 'Exhaust', 'Downpipes', 'Headers',
  'Fuel', 'Intercooler', 'Transmission', 'Tires', 'Suspension',
  'Brakes', 'WeightReduction', 'Aero', 'Drivetrain', 'Custom',
]);

export const addModFromCatalogSchema = z.object({
  vehicleId: z.string().min(1),
  modCatalogId: z.string().min(1),
  /** Override the catalog defaults if set (e.g., dyno-verified gains). */
  hpGain: z.number().int().min(-200).max(2000).optional(),
  torqueGain: z.number().int().min(-200).max(2000).optional(),
  weightChange: z.number().int().min(-500).max(500).optional(),
  verified: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const addCustomModSchema = z.object({
  vehicleId: z.string().min(1),
  customName: z.string().trim().min(1).max(80),
  category: modCategorySchema,
  hpGain: z.number().int().min(-200).max(2000).default(0),
  torqueGain: z.number().int().min(-200).max(2000).default(0),
  weightChange: z.number().int().min(-500).max(500).default(0),
  tractionModifier: z.number().min(-10).max(10).default(0),
  launchModifier: z.number().min(-10).max(10).default(0),
  shiftModifier: z.number().min(-10).max(10).default(0),
  handlingModifier: z.number().min(-10).max(10).default(0),
  reliabilityModifier: z.number().min(-10).max(10).default(0),
  verified: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const updateModSchema = z.object({
  modId: z.string().min(1),
  hpGain: z.number().int().min(-200).max(2000).optional(),
  torqueGain: z.number().int().min(-200).max(2000).optional(),
  weightChange: z.number().int().min(-500).max(500).optional(),
  verified: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

// ── Vehicle overrides ─────────────────────────────────────────────────────

export const vehicleOverridesSchema = z.object({
  vehicleId: z.string().min(1),
  currentHpOverride: z.number().int().min(0).max(3000).nullable().optional(),
  currentTorqueOverride: z.number().int().min(0).max(3000).nullable().optional(),
  currentWeightOverride: z.number().int().min(500).max(15000).nullable().optional(),
  tireType: tireTypeSchema.optional(),
  transmissionOverride: transmissionSchema.optional(),
  drivetrainOverride: drivetrainSchema.optional(),
  driverSkill: z.number().int().min(1).max(10).optional(),
});

// ── Race ──────────────────────────────────────────────────────────────────

export const raceTypeSchema = z.enum([
  'zero_sixty', 'quarter_mile', 'half_mile', 'roll_40_140',
  'highway_pull', 'dig', 'overall',
]);

export const raceRequestSchema = z.object({
  challengerVehicleId: z.string().min(1),
  opponentVehicleId: z.string().min(1),
  raceType: raceTypeSchema,
  saveResult: z.boolean().default(false),
});
