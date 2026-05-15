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
import { users, vehicles, photos, vehicleSpecs, userCarMods, modCatalog } from '@/lib/db/schema';
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
  const modGains: Record<string, { hp: number; tq: number }> = {};
  await Promise.all(
    myCars.map(async (c) => {
      const rows = await db
        .select({
          id: userCarMods.id,
          hpGain: userCarMods.hpGain,
          torqueGain: userCarMods.torqueGain,
          catalogHp: modCatalog.defaultHpGain,
        })
        .from(userCarMods)
        .leftJoin(modCatalog, eq(modCatalog.id, userCarMods.modCatalogId))
        .where(eq(userCarMods.vehicleId, c.id));
      modCounts[c.id] = rows.length;
      let hpSum = 0, tqSum = 0;
      for (const r of rows) {
        const hp = r.hpGain ?? r.catalogHp ?? 0;
        const tq = (r.torqueGain != null && r.torqueGain !== 0) ? r.torqueGain : Math.round(hp * 0.9);
        hpSum += hp;
        tqSum += tq;
      }
      modGains[c.id] = { hp: hpSum, tq: tqSum };
    }),
  );

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 48px' }}>
        <Link
          href="/invites"
          className="ug-glass-tinted"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            height: 52,
            padding: '0 22px',
            marginBottom: 32,
            fontFamily: fonts.mono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.32em',
            color: '#f5f6f7',
            textDecoration: 'none',
            textTransform: 'uppercase',
            overflow: 'hidden',
          }}
        >
          <span style={{ position: 'relative', zIndex: 2 }}>+ Invite a friend →</span>
          <span className="ug-shimmer" />
        </Link>

        <header style={{ marginBottom: 40 }}>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              letterSpacing: '0.4em',
              color: colors.accent,
              marginBottom: 10,
              fontWeight: 700,
            }}
          >
            ∕∕ YOUR GARAGE
          </div>
          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 48px)',
              margin: '0 0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              letterSpacing: '-0.02em',
              fontWeight: 800,
              lineHeight: 1.0,
            }}
          >
            <CallsignWithBadge callsign={me.callsign} isAdmin={me.isModerator} size="lg" />
          </h1>
          {me.regionLabel && (
            <div
              style={{
                fontSize: 11,
                color: colors.textMuted,
                fontFamily: fonts.mono,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              {me.regionLabel}
            </div>
          )}
          {me.bio && (
            <p style={{ fontSize: 15, color: colors.textMuted, marginTop: 18, maxWidth: 620, lineHeight: 1.65 }}>
              {me.bio}
            </p>
          )}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Link href={`/u/${me.callsign}`} className="ug-btn ug-btn-ghost" style={{ padding: '10px 16px', fontSize: 11 }}>
              View public profile →
            </Link>
            <Link href={`/u/${me.callsign}/races`} className="ug-btn ug-btn-ghost" style={{ padding: '10px 16px', fontSize: 11 }}>
              Race log →
            </Link>
          </div>
        </header>

        <MeView userId={userId} cars={myCars} modCounts={modCounts} modGains={modGains} />
      </div>
    </div>
  );
}
