// lib/vehicle-data/cache.ts
//
// Cache-first provider. Checks our own vehicle_specs table for any
// previously-stored specs. This is what makes the system get faster and
// more complete over time — every user who fills in HP/torque/weight for
// a new trim contributes to the cache for everyone else.

import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { vehicleSpecs } from '@/lib/db/schema';
import type { VehicleDataProvider, ProviderSpecs, Trim } from './provider';

export const cacheProvider: VehicleDataProvider = {
  name: 'cache',
  confidence: 'community',

  async hasYearMakeModel(year, make, model) {
    const [row] = await db
      .select({ id: vehicleSpecs.id })
      .from(vehicleSpecs)
      .where(
        and(
          eq(vehicleSpecs.year, year),
          sql`lower(${vehicleSpecs.make}) = ${make.toLowerCase()}`,
          sql`lower(${vehicleSpecs.model}) = ${model.toLowerCase()}`,
        ),
      )
      .limit(1);
    return !!row;
  },

  async listTrims(year, make, model) {
    const rows = await db
      .select({
        id: vehicleSpecs.id,
        trim: vehicleSpecs.trim,
        bodyStyle: vehicleSpecs.bodyStyle,
        engine: vehicleSpecs.engine,
        displacement: vehicleSpecs.displacement,
        aspiration: vehicleSpecs.aspiration,
        fuelType: vehicleSpecs.fuelType,
        transmission: vehicleSpecs.transmission,
        drivetrain: vehicleSpecs.drivetrain,
        stockHp: vehicleSpecs.stockHp,
        stockTorque: vehicleSpecs.stockTorque,
        curbWeight: vehicleSpecs.curbWeight,
        zeroToSixty: vehicleSpecs.zeroToSixty,
        quarterMile: vehicleSpecs.quarterMile,
        topSpeed: vehicleSpecs.topSpeed,
      })
      .from(vehicleSpecs)
      .where(
        and(
          eq(vehicleSpecs.year, year),
          sql`lower(${vehicleSpecs.make}) = ${make.toLowerCase()}`,
          sql`lower(${vehicleSpecs.model}) = ${model.toLowerCase()}`,
        ),
      );

    const trims: Trim[] = rows.map((r) => ({
      key: r.id,
      name: r.trim || 'Base',
      specs: {
        bodyStyle: r.bodyStyle,
        engine: r.engine,
        displacement: r.displacement,
        aspiration: r.aspiration,
        fuelType: r.fuelType,
        transmission: r.transmission,
        drivetrain: r.drivetrain,
        stockHp: r.stockHp,
        stockTorque: r.stockTorque,
        curbWeight: r.curbWeight,
        zeroToSixty: r.zeroToSixty,
        quarterMile: r.quarterMile,
        topSpeed: r.topSpeed,
      },
    }));
    return trims;
  },

  async getSpecs(year, make, model, trim) {
    const [row] = await db
      .select()
      .from(vehicleSpecs)
      .where(
        and(
          eq(vehicleSpecs.year, year),
          sql`lower(${vehicleSpecs.make}) = ${make.toLowerCase()}`,
          sql`lower(${vehicleSpecs.model}) = ${model.toLowerCase()}`,
          sql`lower(${vehicleSpecs.trim}) = ${trim.toLowerCase()}`,
        ),
      )
      .limit(1);
    if (!row) return null;
    return {
      bodyStyle: row.bodyStyle,
      engine: row.engine,
      displacement: row.displacement,
      aspiration: row.aspiration,
      fuelType: row.fuelType,
      transmission: row.transmission,
      drivetrain: row.drivetrain,
      stockHp: row.stockHp,
      stockTorque: row.stockTorque,
      curbWeight: row.curbWeight,
      zeroToSixty: row.zeroToSixty,
      quarterMile: row.quarterMile,
      topSpeed: row.topSpeed,
    };
  },
};
