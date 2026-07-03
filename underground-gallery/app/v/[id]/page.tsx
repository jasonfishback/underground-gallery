// app/v/[id]/page.tsx
// FULL FILE — replace the whole thing.
// Includes existing layout + the new owner panel (photos + mods + hero).

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  vehicles,
  users,
  photos,
  vehicleSpecs,
  userCarMods,
  modCatalog,
  buildEntries,
} from '@/lib/db/schema';
import { CallsignWithBadge } from '@/components/AdminBadge';
import { colors, fonts } from '@/lib/design';
import VehicleOwnerPanel from '@/components/vehicle/VehicleOwnerPanel';
import BuildTimeline, { type TimelineEntry } from '@/components/build/BuildTimeline';
import {
  isScalablePowerMod,
  platformRelativeHpGain,
  platformRelativeTorqueGain,
} from '@/lib/race/mod-scaling';

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
      stockHp: vehicleSpecs.stockHp,
      stockTorque: vehicleSpecs.stockTorque,
      curbWeight: vehicleSpecs.curbWeight,
      drivetrain: vehicleSpecs.drivetrain,
      transmission: vehicleSpecs.transmission,
      engine: vehicleSpecs.engine,
      aspiration: vehicleSpecs.aspiration,
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
  const modsRaw = await db
    .select({
      id: userCarMods.id,
      customName: userCarMods.customName,
      catalogName: modCatalog.name,
      category: userCarMods.category,
      modCatalogId: userCarMods.modCatalogId,
      hpGain: userCarMods.hpGain,
      torqueGain: userCarMods.torqueGain,
      catalogHp: modCatalog.defaultHpGain,
      notes: userCarMods.notes,
    })
    .from(userCarMods)
    .leftJoin(modCatalog, eq(userCarMods.modCatalogId, modCatalog.id))
    .where(eq(userCarMods.vehicleId, v.id));

  // Apply the same platform-relative power scaling the race engine uses, so
  // the displayed HP/torque matches what the car actually races at.
  const mods = modsRaw.map((m) => {
    const flatHp = m.hpGain ?? m.catalogHp ?? 0;
    const untouched =
      m.hpGain == null || (m.catalogHp != null && m.hpGain === m.catalogHp);
    const scalable = isScalablePowerMod(m.modCatalogId) && untouched;
    const hpDelta = scalable
      ? platformRelativeHpGain(m.modCatalogId, v.stockHp, v.aspiration, flatHp)
      : flatHp;
    const tqDelta = scalable
      ? platformRelativeTorqueGain(hpDelta, v.aspiration)
      : m.torqueGain;
    return {
      id: m.id,
      name: m.customName ?? m.catalogName ?? "Mod",
      category: m.category,
      brand: null as string | null,
      hpDelta,
      tqDelta,
      notes: m.notes,
      modCatalogId: m.modCatalogId,
    };
  });

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

  // ---- Build log entries + their photos (visible to everyone) ----
  const entryRows = await db
    .select({
      id: buildEntries.id,
      title: buildEntries.title,
      category: buildEntries.category,
      body: buildEntries.body,
      entryDate: buildEntries.entryDate,
      costCents: buildEntries.costCents,
    })
    .from(buildEntries)
    .where(eq(buildEntries.vehicleId, v.id))
    .orderBy(desc(buildEntries.entryDate), desc(buildEntries.createdAt));

  const entryPhotoRows = entryRows.length
    ? await db
        .select({
          id: photos.id,
          urlFull: photos.urlFull,
          buildEntryId: photos.buildEntryId,
          sortOrder: photos.sortOrder,
          createdAt: photos.createdAt,
        })
        .from(photos)
        .where(inArray(photos.buildEntryId, entryRows.map((e) => e.id)))
        .orderBy(photos.sortOrder, photos.createdAt)
    : [];

  const timelineEntries: TimelineEntry[] = entryRows.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    body: e.body,
    entryDate: e.entryDate.toISOString().slice(0, 10),
    costCents: e.costCents,
    photos: entryPhotoRows
      .filter((p) => p.buildEntryId === e.id)
      .map((p) => ({ id: p.id, url: p.urlFull })),
  }));

  // ---- Build display values ----
  const title = [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ');
  const totalModHp = mods.reduce((sum, m) => sum + (m.hpDelta ?? 0), 0);
  const totalModTorque = mods.reduce((sum, m) => {
    const hp = m.hpDelta ?? 0;
    const tq = m.tqDelta != null && m.tqDelta !== 0 ? m.tqDelta : Math.round(hp * 0.9);
    return sum + tq;
  }, 0);

  const builtHp = (v.stockHp ?? 0) + totalModHp;
  const builtTorque = (v.stockTorque ?? 0) + totalModTorque;

  const currentHp = v.currentHpOverride ?? (v.stockHp != null ? builtHp : null);
  const currentTorque = v.currentTorqueOverride ?? (v.stockTorque != null ? builtTorque : null);
  const currentWeight = v.currentWeightOverride ?? v.curbWeight ?? null;
  const drivetrainDisplay = v.drivetrainOverride ?? v.drivetrain ?? '—';
  const transmissionDisplay = v.transmissionOverride ?? v.transmission ?? '—';

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
            className="ug-card"
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              marginBottom: 24,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.heroUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                fontSize: 'clamp(28px, 5vw, 36px)',
                margin: '0 0 6px',
                letterSpacing: '-0.02em',
                color: colors.text,
                fontWeight: 800,
                lineHeight: 1.05,
              }}
            >
              {title}
            </h1>
            <div style={{ fontSize: 13, color: colors.textMuted }}>
              Owned by{' '}
              <CallsignWithBadge
                callsign={v.ownerCallsign ?? '—'}
                isAdmin={!!v.ownerIsModerator}
                size="sm"
              />
            </div>
          </div>

          {!isOwner && (
            <Link href={`/race?opponent=${v.id}`} className="ug-btn ug-btn-primary">
              Race this car
            </Link>
          )}
        </div>

        {/* Build Log — the story of the car, front and center */}
        <BuildTimeline
          vehicleId={v.id}
          isOwner={isOwner}
          entries={timelineEntries}
        />

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
            ∕∕ Spec Sheet
          </h2>
          <div
            className="ug-card"
            style={{
              fontFamily: fonts.mono,
              fontSize: 12,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <SpecRow label="HP (CURRENT)" value={currentHp ? `${currentHp}` : '—'} stockHint={v.stockHp ? `stock ${v.stockHp}` : null} highlight first />
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
            mods={mods as any}
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
              ∕∕ Modifications
            </h2>
            {mods.length === 0 ? (
              <div
                className="ug-card"
                style={{
                  borderStyle: 'dashed',
                  padding: 32,
                  textAlign: 'center',
                  color: colors.textMuted,
                  fontSize: 13,
                  fontFamily: fonts.mono,
                  letterSpacing: '0.12em',
                }}
              >
                Bone stock.
              </div>
            ) : (
              <div className="ug-card" style={{ overflow: 'hidden', padding: 0 }}>
                {mods.map((m, i) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 16,
                      padding: '14px 18px',
                      borderTop: i === 0 ? 'none' : `1px solid ${colors.border}`,
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
  first,
}: {
  label: string;
  value: string;
  stockHint?: string | null;
  highlight?: boolean;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        padding: '12px 18px',
        borderTop: first ? 'none' : `1px solid ${colors.border}`,
        background: highlight ? 'rgba(255,42,42,0.04)' : 'transparent',
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
