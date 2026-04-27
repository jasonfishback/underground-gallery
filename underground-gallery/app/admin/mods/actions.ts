'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { modCatalog, users } from '@/lib/db/schema';
import { customAlphabet } from 'nanoid';

const newId = customAlphabet(
  '0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz',
  10,
);

const VALID_CATEGORIES = [
  'Tune', 'Turbo', 'Intake', 'Exhaust', 'Downpipes', 'Headers',
  'Fuel', 'Intercooler', 'Transmission', 'Tires', 'Suspension',
  'Brakes', 'WeightReduction', 'Aero', 'Drivetrain', 'Custom',
] as const;

type Category = typeof VALID_CATEGORIES[number];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not signed in');
  const [u] = await db
    .select({ isModerator: users.isModerator })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!u?.isModerator) throw new Error('Not authorized');
}

export async function createMod(input: {
  category: string;
  name: string;
  description?: string;
  defaultHpGain?: number;
  defaultTorqueGain?: number;
  defaultWeightChange?: number;
}) {
  try {
    await requireAdmin();
    if (!VALID_CATEGORIES.includes(input.category as Category)) {
      return { ok: false, error: 'Invalid category' };
    }
    if (!input.name?.trim()) {
      return { ok: false, error: 'Name is required' };
    }
    await db.insert(modCatalog).values({
      id: newId(),
      category: input.category as Category,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      defaultHpGain: input.defaultHpGain ?? 0,
      defaultTorqueGain: input.defaultTorqueGain ?? 0,
      defaultWeightChange: input.defaultWeightChange ?? 0,
      displayOrder: 0,
      active: true,
    });
    revalidatePath('/admin/mods');
    return { ok: true };
  } catch (err) {
    console.error('[createMod]', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function updateMod(input: {
  id: string;
  category: string;
  name: string;
  description?: string;
  defaultHpGain?: number;
  defaultTorqueGain?: number;
  defaultWeightChange?: number;
}) {
  try {
    await requireAdmin();
    if (!VALID_CATEGORIES.includes(input.category as Category)) {
      return { ok: false, error: 'Invalid category' };
    }
    if (!input.name?.trim()) {
      return { ok: false, error: 'Name is required' };
    }
    await db
      .update(modCatalog)
      .set({
        category: input.category as Category,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        defaultHpGain: input.defaultHpGain ?? 0,
        defaultTorqueGain: input.defaultTorqueGain ?? 0,
        defaultWeightChange: input.defaultWeightChange ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(modCatalog.id, input.id));
    revalidatePath('/admin/mods');
    return { ok: true };
  } catch (err) {
    console.error('[updateMod]', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function toggleModActive(id: string, active: boolean) {
  try {
    await requireAdmin();
    await db
      .update(modCatalog)
      .set({ active, updatedAt: new Date() })
      .where(eq(modCatalog.id, id));
    revalidatePath('/admin/mods');
    return { ok: true };
  } catch (err) {
    console.error('[toggleModActive]', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}