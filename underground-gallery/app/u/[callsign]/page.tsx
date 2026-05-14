// app/u/[callsign]/page.tsx
//
// Public-ish profile page (logged-in members only). Shows another user's
// callsign, bio, vehicles, and a link to their race log.

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, vehicles, photos, vehicleSpecs, userCarMods, modCatalog } from '@/lib/db/schema';
import { CallsignWithBadge } from '@/components/AdminBadge';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ callsign: string }>;
}) {
  const { callsign } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.callsign, callsign))
    .limit(1);
  if (!profile) notFound();
  if (profile.status !== 'active') notFound();

  // Their vehicles
  const cars = await db
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
      currentHpOverride: vehicles.currentHpOverride,
      currentTorqueOverride: vehicles.currentTorqueOverride,
      drivetrain: vehicleSpecs.drivetrain,
    })
    .from(vehicles)
    .leftJoin(photos, eq(photos.id, vehicles.primaryPhotoId))
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .where(eq(vehicles.userId, profile.id))
    .orderBy(desc(vehicles.isPrimary), desc(vehicles.createdAt));

  // Sum mod hp/torque gains per vehicle (catalog defaults coalesced)
  const modGains: Record<string, { hp: number; tq: number }> = {};
  await Promise.all(
    cars.map(async (vc) => {
      const rows = await db
        .select({
          hpGain: userCarMods.hpGain,
          torqueGain: userCarMods.torqueGain,
          catalogHp: modCatalog.defaultHpGain,
        })
        .from(userCarMods)
        .leftJoin(modCatalog, eq(modCatalog.id, userCarMods.modCatalogId))
        .where(eq(userCarMods.vehicleId, vc.id));
      let hpSum = 0, tqSum = 0;
      for (const r of rows) {
        const hp = r.hpGain ?? r.catalogHp ?? 0;
        const tq = (r.torqueGain != null && r.torqueGain !== 0) ? r.torqueGain : Math.round(hp * 0.9);
        hpSum += hp;
        tqSum += tq;
      }
      modGains[vc.id] = { hp: hpSum, tq: tqSum };
    }),
  );

  const isMe = session.user.id === profile.id;

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <header className="ug-glass" style={{ marginBottom: 40, padding: 28 }}>
          <div className="ug-mono" style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, marginBottom: 8 }}>
            ∕∕ MEMBER PROFILE
          </div>
          <h1 style={{ fontSize: 36, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <CallsignWithBadge callsign={profile.callsign} isAdmin={profile.isModerator} size="lg" />
            {isMe && (
              <Link
                href="/me"
                className="ug-pill ug-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  color: colors.textMuted,
                  textDecoration: 'none',
                  border: `1px solid ${colors.border}`,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                EDIT →
              </Link>
            )}
          </h1>
          {profile.regionLabel && (
            <div className="ug-mono" style={{ fontSize: 13, color: colors.textMuted }}>
              {profile.regionLabel}
            </div>
          )}
          {profile.bio && (
            <p style={{ fontSize: 14, color: colors.text, marginTop: 16, maxWidth: 600, lineHeight: 1.6 }}>
              {profile.bio}
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <Link
              href={`/u/${profile.callsign}/races`}
              className="ug-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                color: colors.textMuted,
                textDecoration: 'none',
              }}
            >
              VIEW RACE LOG →
            </Link>
          </div>
        </header>

        <div className="ug-mono" style={{ fontSize: 11, letterSpacing: '0.4em', color: colors.accent, marginBottom: 16, fontWeight: 700 }}>
          ∕∕ {cars.length} {cars.length === 1 ? 'VEHICLE' : 'VEHICLES'}
        </div>

        {cars.length === 0 ? (
          <div
            className="ug-card"
            style={{
              textAlign: 'center',
              padding: 64,
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            No vehicles yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {cars.map((c) => {
              const hp = c.currentHpOverride ?? ((c.stockHp ?? 0) + (modGains[c.id]?.hp ?? 0));
              const tq = c.currentTorqueOverride ?? ((c.stockTorque ?? 0) + (modGains[c.id]?.tq ?? 0));
              return (
                <Link
                  key={c.id}
                  href={`/v/${c.id}`}
                  className="ug-card"
                  style={{
                    color: colors.text,
                    textDecoration: 'none',
                    overflow: 'hidden',
                    display: 'block',
                    borderColor: c.isPrimary ? colors.accentBorder : undefined,
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '16 / 9',
                      background: c.thumbUrl ? `url(${c.thumbUrl}) center/cover` : 'rgba(255,255,255,0.02)',
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  />
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {c.year} {c.make} {c.model}
                    </div>
                    {c.trim && (
                      <div className="ug-mono" style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                        {c.trim}
                      </div>
                    )}
                    <div className="ug-mono" style={{ marginTop: 10, display: 'flex', gap: 12, fontSize: 11, color: colors.textMuted }}>
                      {hp != null && <span style={{ color: colors.text }}>{hp} hp</span>}{tq != null && tq > 0 && <span style={{ color: colors.text }}>{tq} tq</span>}
                      {c.drivetrain && <span>{c.drivetrain}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
