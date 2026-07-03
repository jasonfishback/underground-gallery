// lib/vehicle-data/llm.ts
//
// LLM-backed vehicle spec lookup. Used as a fallback provider when neither
// the local cache nor NHTSA has stock HP/torque/weight for a Y/M/M.
//
// Returns null on:
//   - Missing OPENAI_API_KEY (so dev/preview without the key degrade gracefully)
//   - LLM error / timeout
//   - LLM low confidence (we discard responses where stockHp / curbWeight are
//     both null — that signals "I don't know this vehicle")
//
// Results from here are written back to the vehicle_specs table by the
// server action that calls us, so each Y/M/M is only paid for once.

import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { VehicleDataProvider, ProviderSpecs } from './provider';

const specSchema = z.object({
  bodyStyle: z.string().nullable().describe('e.g. "Sedan", "Coupe", "Pickup", "SUV"'),
  engine: z.string().nullable().describe('e.g. "V8", "Twin-turbo I6", "Boxer 4"'),
  displacement: z.string().nullable().describe('Liters, e.g. "5.0L", "6.2L"'),
  aspiration: z
    .enum(['NA', 'Turbo', 'TwinTurbo', 'Supercharged', 'EV', 'Hybrid', 'Other'])
    .nullable(),
  fuelType: z.string().nullable().describe('e.g. "Gasoline", "Diesel", "Hybrid", "Electric"'),
  transmission: z.enum(['Manual', 'Auto', 'DCT', 'CVT', 'Other']).nullable(),
  drivetrain: z.enum(['RWD', 'FWD', 'AWD', '4WD']).nullable(),
  stockHp: z.number().int().min(20).max(2000).nullable().describe('Stock horsepower of the base/most-common trim'),
  stockTorque: z.number().int().min(20).max(2000).nullable().describe('Stock peak torque in lb-ft'),
  curbWeight: z.number().int().min(800).max(15000).nullable().describe('Curb weight in lb'),
  zeroToSixty: z.number().min(1).max(30).nullable().describe('0–60 mph in seconds'),
  quarterMile: z.number().min(7).max(30).nullable().describe('1/4 mile elapsed time in seconds'),
  topSpeed: z.number().int().min(50).max(350).nullable().describe('Top speed in mph'),
});

export type LlmSpecResult = z.infer<typeof specSchema>;

async function lookupViaLlm(
  year: number,
  make: string,
  model: string,
  trim?: string,
): Promise<ProviderSpecs | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const trimPart = trim?.trim() ? ` ${trim.trim()}` : '';
  const label = `${year} ${make} ${model}${trimPart}`;
  const hasTrim = !!trim?.trim();

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: specSchema,
      // Deterministic: factual recall, not creativity.
      temperature: 0,
      system:
        'You are an automotive specifications database. Return the EXACT ' +
        'factory specifications for the specified year/make/model/trim.\n' +
        '- stockHp / stockTorque: manufacturer SAE-net CRANK (flywheel) ' +
        'ratings in hp and lb-ft — never wheel/dyno numbers.\n' +
        '- curbWeight: manufacturer curb weight in lb (fueled, no occupants).\n' +
        '- When a specific trim or variant is named (e.g. "GT 55", "GT 63 S", ' +
        '"Competition", "Type R", "Z51", "Hellcat"), return THAT variant\'s ' +
        'exact numbers. Do NOT substitute the base model. Distinguish variants ' +
        'that share a model name but differ mechanically (AMG GT 43 vs 55 vs 63; ' +
        'M3 vs M3 Competition; Golf GTI vs R).\n' +
        '- Use official published 0-60, 1/4-mile, and top speed where available; ' +
        'otherwise null.\n' +
        '- If you cannot confidently identify the exact variant, return null for ' +
        'the numeric fields rather than guessing a different trim.' +
        (hasTrim
          ? ''
          : '\n- No trim was given: use the highest-volume base trim and ' +
            'set trim expectations conservatively.'),
      prompt: `Return factory specs for: ${label}`,
      // gpt-4o is a touch slower than mini; give it room but keep it snappy.
      abortSignal: AbortSignal.timeout(20_000),
    });

    // Reject low-confidence responses. If the LLM couldn't anchor on stock
    // HP AND curb weight, treat the result as unknown.
    if (object.stockHp == null && object.curbWeight == null) {
      return null;
    }

    return {
      bodyStyle: object.bodyStyle,
      engine: object.engine,
      displacement: object.displacement,
      aspiration: object.aspiration,
      fuelType: object.fuelType,
      transmission: object.transmission,
      drivetrain: object.drivetrain,
      stockHp: object.stockHp,
      stockTorque: object.stockTorque,
      curbWeight: object.curbWeight,
      zeroToSixty: object.zeroToSixty,
      quarterMile: object.quarterMile,
      topSpeed: object.topSpeed,
    };
  } catch (err) {
    console.error('[llm provider] lookup failed for', label, err);
    return null;
  }
}

export const llmProvider: VehicleDataProvider = {
  name: 'llm',
  confidence: 'estimated',
  async getSpecs(year, make, model, trim) {
    return lookupViaLlm(year, make, model, trim);
  },
};
