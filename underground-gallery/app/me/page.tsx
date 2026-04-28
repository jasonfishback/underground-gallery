// app/me/page.tsx
//
// The user's own profile page. Shows their callsign, bio, region, and a
// list of their vehicles. The "Add vehicle" button opens the existing
// AddCarWizard which auto-pulls stock specs from the catalog → NHTSA.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, vehicles, photos, vehicleSpecs, userCarMods } from '@/lib/db/schema';
import { CallsignWithBadge } from '@/components/AdminBadge';
import { MeView } from '@/components/me/MeView';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');
  const userId = session.user.id;

  const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!me) redirect('/auth/signin');
  if (me.status !== 'active') redirect('/pending');

  // Load my vehicles + linked specs + thumb photos
  const myCars = await db
    .select({
      id: vehicles.id,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      isPrimary: vehicles.isPrimary,
      thumbUrl: photos.urlThumb,
      stockHp: vehicleSpecs.stockHp,
      stockTorque: vehicleSpecs.stockTorque,
      curbWeight: vehicleSpecs.curbWeight,
      drivetrain: vehicleSpecs.drivetrain,
      transmission: vehicleSpecs.transmission,
      currentHpOverride: vehicles.currentHpOverride,
      currentTorqueOverride: vehicles.currentTorqueOverride,
      currentWeightOverride: vehicles.currentWeightOverride,
      tireType: vehicles.tireType,
      driverSkill: vehicles.driverSkill,
    })
    .from(vehicles)
    .leftJoin(photos, eq(photos.id, vehicles.primaryPhotoId))
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .where(eq(vehicles.userId, userId))
    .orderBy(desc(vehicles.isPrimary), desc(vehicles.createdAt));

  // Mod counts per vehicle (parallel queries — fine for low car count)
  const modCounts: Record<string, number> = {};
  const modHpGains: Record<string, number> = {};
  await Promise.all(
    myCars.map(async (c) => {
      const rows = await db
        .select({ id: userCarMods.id, hpGain: userCarMods.hpGain })
        .from(userCarMods)
        .where(eq(userCarMods.vehicleId, c.id));
      modCounts[c.id] = rows.length;
      modHpGains[c.id] = rows.reduce((s, r) => s + (r.hpGain ?? 0), 0);
    }),
  );

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <Link
        href="/invites"
        style={{
          display: 'block',
          background: '#ff2a2a',
          color: '#0a0a0a',
          padding: '14px 20px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.3em',
          textDecoration: 'none',
          textAlign: 'center',
          margin: '0 0 16px',
        }}
      >
        + INVITE A FRIEND →
      </Link>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <header style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, marginBottom: 8 }}>
            YOUR GARAGE
          </div>
          <h1 style={{ fontSize: 36, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <CallsignWithBadge callsign={me.callsign} isAdmin={me.isModerator} size="lg" />
          </h1>
          {me.regionLabel && (
            <div style={{ fontSize: 13, color: colors.textMuted, fontFamily: fonts.mono }}>
              {me.regionLabel}
            </div>
          )}
          {me.bio && (
            <p style={{ fontSize: 14, color: colors.text, marginTop: 16, maxWidth: 600, lineHeight: 1.6 }}>
              {me.bio}
            </p>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 11, color: colors.textMuted, fontFamily: fonts.mono, letterSpacing: '0.2em' }}>
            <Link href={`/u/${me.callsign}`} style={{ color: colors.textMuted, textDecoration: 'none' }}>
              VIEW PUBLIC PROFILE →
            </Link>
            <Link href={`/u/${me.callsign}/races`} style={{ color: colors.textMuted, textDecoration: 'none' }}>
              RACE LOG →
            </Link>
          </div>
        </header>

        <MeView userId={userId} cars={myCars} modCounts={modCounts} modHpGains={modHpGains} />
      </div>
    </div>
  );
}
