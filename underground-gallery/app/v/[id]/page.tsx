// app/v/[id]/page.tsx
// FULL FILE — replace the whole thing.
// Includes existing layout + the new owner panel (photos + mods + hero).

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  vehicles,
  users,
  photos,
  vehicleSpecs,
  userCarMods,
} from '@/lib/db/schema';
import { CallsignWithBadge } from '@/components/AdminBadge';
import { colors, fonts } from '@/lib/design';
import VehicleOwnerPanel from '@/components/vehicle/VehicleOwnerPanel';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export default async function VehicleDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth/signin?next=/v/${id}`);

  // ---- Load vehicle + owner + spec + (optional) primary photo ----
  const rows = await db
    .select({
      id: vehicles.id,
      userId: vehicles.userId,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      isPrimary: vehicles.isPrimary,
      primaryPhotoId: vehicles.primaryPhotoId,
      tireType: vehicles.tireType,
      driverSkill: vehicles.driverSkill,
      currentHpOverride: vehicles.currentHpOverride,
      currentTorqueOverride: vehicles.currentTorqueOverride,
      currentWeightOverride: vehicles.currentWeightOverride,
      drivetrainOverride: vehicles.drivetrainOverride,
      transmissionOverride: vehicles.transmissionOverride,
      ownerCallsign: users.callsign,
      ownerIsModerator: users.isModerator,
      ownerId: users.id,
      heroUrl: photos.urlFull,
      stockHp: vehicleSpecs.hpStock,
      stockTorque: vehicleSpecs.torqueStock,
      curbWeight: vehicleSpecs.weightStock,
      drivetrain: vehicleSpecs.drivetrain,
      transmission: vehicleSpecs.transmission,
      engine: vehicleSpecs.engine,
    })
    .from(vehicles)
    .innerJoin(users, eq(users.id, vehicles.userId))
    .leftJoin(photos, eq(photos.id, vehicles.primaryPhotoId))
    .leftJoin(vehicleSpecs, eq(vehicleSpecs.id, vehicles.vehicleSpecId))
    .where(eq(vehicles.id, id))
    .limit(1);

  const v = rows[0];
  if (!v) notFound();

  const isOwner = v.userId === session.user.id;

  // ---- Mods (used by both owner panel and read-only display) ----
  const mods = await db
    .select({
      id: userCarMods.id,
      name: userCarMods.name,
      category: userCarMods.category,
      brand: userCarMods.brand,
      hpDelta: userCarMods.hpDelta,
      notes: userCarMods.notes,
    })
    .from(userCarMods)
    .where(eq(userCarMods.vehicleId, v.id));

  // ---- Photos (used by owner panel) ----
  const vehiclePhotos = isOwner
    ? await db
        .select({
          id: photos.id,
          urlFull: photos.urlFull,
          urlThumb: photos.urlThumb,
        })
        .from(photos)
        .where(
          and(
            eq(photos.subjectType, 'vehicle'),
            eq(photos.subjectId, v.id),
          ),
        )
        .orderBy(photos.sortOrder)
    : [];

  // ---- Build display values ----
  const title = [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
  const currentHp = v.currentHpOverride ?? v.stockHp ?? null;
  const currentTorque = v.currentTorqueOverride ?? v.stockTorque ?? null;
  const currentWeight = v.currentWeightOverride ?? v.curbWeight ?? null;
  const drivetrainDisplay = v.drivetrainOverride ?? v.drivetrain ?? '—';
  const transmissionDisplay = v.transmissionOverride ?? v.transmission ?? '—';

  const totalModHp = mods.reduce((sum, m) => sum + (m.hpDelta ?? 0), 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.bg,
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Breadcrumbs */}
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: colors.textMuted,
            marginBottom: 16,
          }}
        >
          <Link href="/me" style={{ color: colors.textMuted, textDecoration: 'none' }}>
            GARAGE
          </Link>
          {' / '}
          <Link
            href={v.ownerCallsign ? `/u/${v.ownerCallsign}` : '#'}
            style={{ color: colors.textMuted, textDecoration: 'none' }}
          >
            {v.ownerCallsign ?? 'OWNER'}
          </Link>
          {' / '}
          <span style={{ color: colors.text }}>{title}</span>
        </div>

        {/* Hero photo (if exists) */}
        {v.heroUrl ? (
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              background: colors.bgElevated,
              border: `0.5px solid ${colors.border}`,
              marginBottom: 24,
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.heroUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : null}

        {/* Title + RACE THIS button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 8,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 32,
                margin: '0 0 4px',
                letterSpacing: '0.05em',
                color: colors.text,
              }}
            >
              {title}
            </h1>
            <div style={{ fontSize: 13, color: colors.textMuted }}>
              Owned by{' '}
              <CallsignWithBadge
                callsign={v.ownerCallsign ?? '—'}
                isModerator={!!v.ownerIsModerator}
                size="sm"
              />
            </div>
          </div>

          {!isOwner && (
            <Link
              href={`/race?opponent=${v.id}`}
              style={{
                padding: '12px 22px',
                background: colors.accent,
                color: '#0a0a0a',
                fontFamily: fonts.mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.3em',
                textDecoration: 'none',
              }}
            >
              RACE THIS CAR
            </Link>
          )}
        </div>

        {/* Spec sheet */}
        <section style={{ marginTop: 32 }}>
          <h2
            style={{
              fontSize: 11,
              letterSpacing: '0.4em',
              color: colors.textMuted,
              fontFamily: fonts.mono,
              fontWeight: 700,
              margin: '0 0 16px',
              textTransform: 'uppercase',
            }}
          >
            Spec Sheet
          </h2>
          <div
            style={{
              background: colors.bgElevated,
              border: `0.5px solid ${colors.border}`,
              fontFamily: fonts.mono,
              fontSize: 12,
            }}
          >
            <SpecRow label="HP (CURRENT)" value={currentHp ? `${currentHp}` : '—'} stockHint={v.stockHp ? `stock ${v.stockHp}` : null} highlight />
            <SpecRow label="TORQUE" value={currentTorque ? `${currentTorque} lb-ft` : '—'} stockHint={v.stockTorque ? `stock ${v.stockTorque}` : null} />
            <SpecRow label="WEIGHT" value={currentWeight ? `${currentWeight} lb` : '—'} stockHint={v.curbWeight ? `stock ${v.curbWeight}` : null} />
            <SpecRow label="DRIVETRAIN" value={drivetrainDisplay} />
            <SpecRow label="TRANSMISSION" value={transmissionDisplay} />
            <SpecRow label="ENGINE" value={v.engine ?? '—'} />
            <SpecRow label="MOD GAIN" value={totalModHp > 0 ? `+${totalModHp} hp` : `${totalModHp} hp`} />
          </div>
        </section>

        {/* OWNER MODE — photos + mods manager */}
        {isOwner ? (
          <VehicleOwnerPanel
            vehicleId={v.id}
            primaryPhotoId={v.primaryPhotoId ?? null}
            photos={vehiclePhotos}
            mods={mods}
          />
        ) : (
          // Read-only mods list for non-owners
          <section style={{ marginTop: 32 }}>
            <h2
              style={{
                fontSize: 11,
                letterSpacing: '0.4em',
                color: colors.textMuted,
                fontFamily: fonts.mono,
                fontWeight: 700,
                margin: '0 0 16px',
                textTransform: 'uppercase',
              }}
            >
              Modifications
            </h2>
            {mods.length === 0 ? (
              <div
                style={{
                  background: colors.bgElevated,
                  border: `0.5px dashed ${colors.border}`,
                  padding: 24,
                  textAlign: 'center',
                  color: colors.textMuted,
                  fontSize: 13,
                }}
              >
                Bone stock.
              </div>
            ) : (
              <div
                style={{
                  background: colors.bgElevated,
                  border: `0.5px solid ${colors.border}`,
                }}
              >
                {mods.map((m, i) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 16,
                      padding: '12px 16px',
                      borderTop: i === 0 ? 'none' : `0.5px solid ${colors.border}`,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 9,
                        letterSpacing: '0.3em',
                        color: colors.textMuted,
                        fontWeight: 700,
                        minWidth: 80,
                      }}
                    >
                      {m.category?.toUpperCase() ?? 'OTHER'}
                    </span>
                    <span style={{ fontSize: 13, color: colors.text }}>
                      {m.brand ? <strong>{m.brand}</strong> : null} {m.name}
                      {m.notes ? (
                        <span style={{ color: colors.textMuted }}> — {m.notes}</span>
                      ) : null}
                    </span>
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 11,
                        color:
                          m.hpDelta && m.hpDelta > 0
                            ? colors.accent
                            : colors.textDim,
                      }}
                    >
                      {m.hpDelta != null
                        ? `${m.hpDelta > 0 ? '+' : ''}${m.hpDelta} hp`
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
  stockHint,
  highlight,
}: {
  label: string;
  value: string;
  stockHint?: string | null;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        padding: '10px 16px',
        borderTop: `0.5px solid ${colors.border}`,
      }}
    >
      <span
        style={{
          color: colors.textMuted,
          letterSpacing: '0.3em',
          fontSize: 9,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: highlight ? colors.accent : colors.text,
          textAlign: 'right',
        }}
      >
        {value}
        {stockHint ? (
          <span
            style={{
              color: colors.textDim,
              fontSize: 10,
              marginLeft: 8,
              letterSpacing: '0.1em',
            }}
          >
            ({stockHint})
          </span>
        ) : null}
      </span>
    </div>
  );
}
