// app/v/[id]/page.tsx
//
// Public vehicle detail page. Anyone logged-in can view; only the owner
// can edit (currently shown as the "Race This Car" button being a
// challenge link if you're not the owner).

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { vehicles, users, photos, vehicleSpecs, userCarMods } from '@/lib/db/schema';
import { CallsignWithBadge } from '@/components/AdminBadge';
import { colors, fonts, styles } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const [v] = await db
    .select({
      id: vehicles.id,
      userId: vehicles.userId,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      isPrimary: vehicles.isPrimary,
      tireType: vehicles.tireType,
      driverSkill: vehicles.driverSkill,
      currentHpOverride: vehicles.currentHpOverride,
      currentTorqueOverride: vehicles.currentTorqueOverride,
      currentWeightOverride: vehicles.currentWeightOverride,
      drivetrainOverride: vehicles.drivetrainOverride,
      transmissionOverride: vehicles.transmissionOverride,
      ownerCallsign: users.callsign,
      ownerIsAdmin: users.isModerator,
      ownerId: users.id,
      thumbUrl: photos.urlFull,
      stockHp: vehicleSpecs.stockHp,
      stockTorque: vehicleSpecs.stockTorque,
      curbWeight: vehicleSpecs.curbWeight,
      drivetrain: vehicleSpecs.drivetrain,
      transmission: vehicleSpecs.transmission,
      engine: vehicleSpecs.engine,
      displacement: vehicleSpecs.displacement,
      aspiration: vehicleSpecs.aspiration,
      stockZeroToSixty: vehicleSpecs.zeroToSixty,
      stockQuarterMile: vehicleSpecs.quarterMile,
    })
    .from(vehicles)
    .leftJoin(users, eq(users.id, vehicles.userId))
    .leftJoin(photos, eq(photos.id, vehicles.primaryPhotoId))
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .where(eq(vehicles.id, id))
    .limit(1);

  if (!v) notFound();

  const mods = await db.select().from(userCarMods).where(eq(userCarMods.vehicleId, id));
  const isOwner = v.userId === session.user.id;

  // Use overrides if set, otherwise stock
  const currentHp = v.currentHpOverride ?? v.stockHp;
  const currentTorque = v.currentTorqueOverride ?? v.stockTorque;
  const currentWeight = v.currentWeightOverride ?? v.curbWeight;
  const drivetrain = v.drivetrainOverride ?? v.drivetrain;
  const transmission = v.transmissionOverride ?? v.transmission;

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 16 }}>
          <Link
            href={isOwner ? '/me' : `/u/${v.ownerCallsign}`}
            style={{ fontSize: 11, letterSpacing: '0.3em', color: colors.textMuted, textDecoration: 'none', fontFamily: fonts.mono }}
          >
            ← {isOwner ? 'YOUR GARAGE' : `@${v.ownerCallsign}`}
          </Link>
        </div>

        {/* Hero with photo */}
        <div
          style={{
            aspectRatio: '16 / 7',
            background: v.thumbUrl
              ? `linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.95) 100%), url(${v.thumbUrl}) center/cover`
              : '#0d0d0d',
            border: `0.5px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 32,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <CallsignWithBadge callsign={v.ownerCallsign} isAdmin={v.ownerIsAdmin ?? false} size="md" />
            {v.isPrimary && (
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  color: colors.accent,
                  border: `0.5px solid ${colors.accent}`,
                  padding: '2px 8px',
                  fontFamily: fonts.mono,
                  fontWeight: 700,
                }}
              >
                PRIMARY
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 42, margin: 0, letterSpacing: '0.02em', fontWeight: 700 }}>
            {v.year} {v.make} {v.model}
          </h1>
          {v.trim && (
            <div style={{ fontSize: 16, color: colors.textMuted, marginTop: 4, fontFamily: fonts.mono }}>
              {v.trim}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <Link
            href={`/race?opponent=${v.id}`}
            style={{
              ...styles.buttonPrimary,
              textDecoration: 'none',
              padding: '14px 24px',
              fontSize: 12,
            }}
          >
            🏁 RACE THIS CAR
          </Link>
        </div>

        {/* Spec sheet */}
        <Section title="STOCK + CURRENT">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            <Stat label="Power" stock={v.stockHp ? `${v.stockHp} hp` : null} current={currentHp ? `${currentHp} hp` : null} />
            <Stat label="Torque" stock={v.stockTorque ? `${v.stockTorque} lb-ft` : null} current={currentTorque ? `${currentTorque} lb-ft` : null} />
            <Stat label="Weight" stock={v.curbWeight ? `${v.curbWeight.toLocaleString()} lb` : null} current={currentWeight ? `${currentWeight.toLocaleString()} lb` : null} />
            <Stat label="Drivetrain" stock={v.drivetrain} current={drivetrain} />
            <Stat label="Trans" stock={v.transmission} current={transmission} />
            {v.engine && <Stat label="Engine" stock={v.engine} current={v.engine} />}
            {v.tireType && <Stat label="Tires" stock={null} current={v.tireType} />}
          </div>
        </Section>

        {v.stockZeroToSixty || v.stockQuarterMile ? (
          <Section title="STOCK NUMBERS">
            <div style={{ display: 'flex', gap: 32, fontFamily: fonts.mono }}>
              {v.stockZeroToSixty && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.3em', color: colors.textDim }}>0–60</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{v.stockZeroToSixty.toFixed(1)}<span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>s</span></div>
                </div>
              )}
              {v.stockQuarterMile && (
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.3em', color: colors.textDim }}>1/4 MILE</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{v.stockQuarterMile.toFixed(2)}<span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>s</span></div>
                </div>
              )}
            </div>
          </Section>
        ) : null}

        {mods.length > 0 && (
          <Section title={`MODS (${mods.length})`}>
            <div style={{ display: 'grid', gap: 8 }}>
              {mods.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: 12,
                    background: '#111',
                    border: `0.5px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: fonts.mono,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{m.customName ?? m.category}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{m.category}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: colors.textMuted }}>
                    {(m.hpGain ?? 0) > 0 && <span style={{ color: colors.accent }}>+{m.hpGain} hp</span>}
                    {(m.torqueGain ?? 0) > 0 && <span style={{ color: colors.accent }}>+{m.torqueGain} tq</span>}
                    {m.verified && <span style={{ color: colors.success }}>✓ DYNO'D</span>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, marginBottom: 12, fontFamily: fonts.mono, fontWeight: 700 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, stock, current }: { label: string; stock: string | null; current: string | null }) {
  const changed = stock !== current && stock !== null && current !== null;
  return (
    <div style={{ padding: 12, background: '#111', border: `0.5px solid ${colors.border}`, fontFamily: fonts.mono }}>
      <div style={{ fontSize: 9, letterSpacing: '0.3em', color: colors.textDim, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: changed ? colors.accent : colors.text }}>
        {current ?? stock ?? '—'}
      </div>
      {changed && stock && (
        <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2, textDecoration: 'line-through' }}>
          {stock}
        </div>
      )}
    </div>
  );
}
