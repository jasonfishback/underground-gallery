// app/api/og/race/[slug]/route.tsx
//
// Dynamic 1200×630 PNG generation for race spectate links.
// When someone pastes /r/[slug] into iMessage / Twitter / WhatsApp /
// Discord / Slack, the platform fetches this URL and gets a polished
// preview card. This is a huge driver of click-through.
//
// Uses Next's built-in `ImageResponse` (Vercel Edge runtime / Satori) —
// no ffmpeg, no external service, no Lambda layer. Renders JSX-like markup
// to PNG at request time. Fonts are loaded inline.
//
// IMPORTANT: This route uses a small subset of CSS that Satori supports:
//   - flexbox layout (no grid, no float)
//   - basic colors, fonts, borders
//   - background images via plain CSS url()
// Reference: https://vercel.com/docs/functions/og-image-generation

import { ImageResponse } from 'next/og';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { raceResults, vehicles, users, photos } from '@/lib/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cache the image at the CDN edge for 1 hour. Race results are immutable
// once written (other than the public-toggle), so longer is fine.
export const revalidate = 3600;

const RACE_LABEL: Record<string, string> = {
  zero_sixty: '0–60',
  quarter_mile: 'QUARTER MILE',
  half_mile: 'HALF MILE',
  roll_40_140: '40–140 ROLL',
  highway_pull: 'HIGHWAY PULL',
  dig: 'DIG RACE',
  overall: 'OVERALL',
};

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [r] = await db
    .select()
    .from(raceResults)
    .where(
      and(
        eq(raceResults.shareSlug, slug),
        eq(raceResults.isPublic, true),
        isNull(raceResults.hiddenAt),
      ),
    )
    .limit(1);

  if (!r) {
    return new ImageResponse(<NotFoundCard />, { width: 1200, height: 630 });
  }

  // Both vehicles + users + primary photos
  const [chalV] = r.challengerVehicleId
    ? await db
        .select({
          year: vehicles.year, make: vehicles.make, model: vehicles.model, trim: vehicles.trim,
          primaryPhotoId: vehicles.primaryPhotoId,
        })
        .from(vehicles).where(eq(vehicles.id, r.challengerVehicleId)).limit(1)
    : [null];
  const [oppV] = r.opponentVehicleId
    ? await db
        .select({
          year: vehicles.year, make: vehicles.make, model: vehicles.model, trim: vehicles.trim,
          primaryPhotoId: vehicles.primaryPhotoId,
        })
        .from(vehicles).where(eq(vehicles.id, r.opponentVehicleId)).limit(1)
    : [null];

  const [chalU] = await db
    .select({ callsign: users.callsign, isModerator: users.isModerator })
    .from(users).where(eq(users.id, r.challengerUserId)).limit(1);
  const [oppU] = r.opponentUserId
    ? await db
        .select({ callsign: users.callsign, isModerator: users.isModerator })
        .from(users).where(eq(users.id, r.opponentUserId)).limit(1)
    : [null];

  const [chalPhoto] = chalV?.primaryPhotoId
    ? await db.select({ urlFull: photos.urlFull }).from(photos).where(eq(photos.id, chalV.primaryPhotoId)).limit(1)
    : [null];
  const [oppPhoto] = oppV?.primaryPhotoId
    ? await db.select({ urlFull: photos.urlFull }).from(photos).where(eq(photos.id, oppV.primaryPhotoId)).limit(1)
    : [null];

  const winner =
    r.winnerVehicleId === r.challengerVehicleId
      ? 'challenger'
      : r.winnerVehicleId === r.opponentVehicleId
        ? 'opponent'
        : 'tie';

  return new ImageResponse(
    (
      <RaceCard
        chalCallsign={chalU?.callsign ?? '???'}
        chalAdmin={chalU?.isModerator ?? false}
        chalCar={chalV ? `${chalV.year} ${chalV.make} ${chalV.model}` : 'Unknown'}
        chalPhoto={chalPhoto?.urlFull ?? null}
        chalEt={r.challengerEstimatedEt}
        chalTrap={r.challengerTrapSpeed}
        oppCallsign={oppU?.callsign ?? '???'}
        oppAdmin={oppU?.isModerator ?? false}
        oppCar={oppV ? `${oppV.year} ${oppV.make} ${oppV.model}` : 'Unknown'}
        oppPhoto={oppPhoto?.urlFull ?? null}
        oppEt={r.opponentEstimatedEt}
        oppTrap={r.opponentTrapSpeed}
        winner={winner}
        gap={r.estimatedGap ?? 0}
        raceType={r.raceType}
      />
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

// ── Card layout ─────────────────────────────────────────────────────────

function RaceCard(props: {
  chalCallsign: string; chalAdmin: boolean; chalCar: string; chalPhoto: string | null;
  chalEt: number | null; chalTrap: number | null;
  oppCallsign: string; oppAdmin: boolean; oppCar: string; oppPhoto: string | null;
  oppEt: number | null; oppTrap: number | null;
  winner: 'challenger' | 'opponent' | 'tie';
  gap: number;
  raceType: string;
}) {
  const winnerCs =
    props.winner === 'challenger' ? props.chalCallsign
    : props.winner === 'opponent' ? props.oppCallsign
    : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        color: '#fafafa',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          padding: '24px 40px',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #222',
        }}
      >
        <div style={{ display: 'flex', fontSize: 16, letterSpacing: '0.4em', color: '#ff3030', fontWeight: 700 }}>
          UNDERGROUND GALLERY
        </div>
        <div style={{ display: 'flex', fontSize: 14, letterSpacing: '0.4em', color: '#888' }}>
          {RACE_LABEL[props.raceType] ?? props.raceType.toUpperCase()}
        </div>
      </div>

      {/* Main area: split with VS in middle */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Side
          photo={props.chalPhoto}
          callsign={props.chalCallsign}
          isAdmin={props.chalAdmin}
          car={props.chalCar}
          et={props.chalEt}
          trap={props.chalTrap}
          isWinner={props.winner === 'challenger'}
          alignRight
        />
        <Side
          photo={props.oppPhoto}
          callsign={props.oppCallsign}
          isAdmin={props.oppAdmin}
          car={props.oppCar}
          et={props.oppEt}
          trap={props.oppTrap}
          isWinner={props.winner === 'opponent'}
        />

        {/* VS center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            background: '#0a0a0a',
            border: '2px solid #ff3030',
            borderRadius: 70,
          }}
        >
          <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, color: '#ff3030', letterSpacing: '0.05em' }}>
            VS
          </div>
        </div>
      </div>

      {/* Bottom result strip */}
      <div
        style={{
          display: 'flex',
          padding: '20px 40px',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #222',
          background: winnerCs ? 'rgba(255,48,48,0.12)' : '#0d0d0d',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, letterSpacing: '0.03em' }}>
          {winnerCs ? (
            <>
              <span style={{ color: '#ff3030' }}>@{winnerCs}</span>
              <span style={{ color: '#888', marginLeft: 16 }}>
                BY {props.gap < 0.2 ? 'A FENDER' : `${props.gap.toFixed(2)}s`}
              </span>
            </>
          ) : (
            <span style={{ color: '#888' }}>DEAD HEAT</span>
          )}
        </div>
        <div style={{ display: 'flex', fontSize: 12, letterSpacing: '0.3em', color: '#888' }}>
          undergroundgallery.ai
        </div>
      </div>
    </div>
  );
}

function Side(props: {
  photo: string | null;
  callsign: string;
  isAdmin: boolean;
  car: string;
  et: number | null;
  trap: number | null;
  isWinner: boolean;
  alignRight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: 32,
        justifyContent: 'flex-end',
        alignItems: props.alignRight ? 'flex-end' : 'flex-start',
        ...(props.photo
          ? {
              backgroundImage: `linear-gradient(${props.alignRight ? '270deg' : '90deg'}, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 100%), url(${props.photo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { background: '#0d0d0d' }),
      }}
    >
      {props.isWinner && (
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 90,
            ...(props.alignRight ? { right: 32 } : { left: 32 }),
            background: '#ff3030',
            color: '#fff',
            fontSize: 14,
            letterSpacing: '0.4em',
            padding: '6px 12px',
            fontWeight: 700,
          }}
        >
          ✓ WINNER
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
          ...(props.alignRight ? { justifyContent: 'flex-end' } : {}),
        }}
      >
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, color: '#ff3030', letterSpacing: '0.02em' }}>
          @{props.callsign}
        </div>
        {props.isAdmin && (
          <div
            style={{
              display: 'flex',
              fontSize: 14,
              letterSpacing: '0.3em',
              color: '#ff3030',
              border: '1px solid #ff3030',
              padding: '4px 10px',
              fontWeight: 700,
            }}
          >
            ADMIN
          </div>
        )}
      </div>

      <div style={{ display: 'flex', fontSize: 22, color: '#fafafa', marginBottom: 16, fontWeight: 600 }}>
        {props.car}
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {props.et !== null && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 11, letterSpacing: '0.3em', color: '#888', marginBottom: 2 }}>
              ET
            </div>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>
              {props.et.toFixed(2)}
              <span style={{ display: 'flex', fontSize: 14, color: '#888', marginLeft: 4, alignSelf: 'flex-end', marginBottom: 4 }}>
                s
              </span>
            </div>
          </div>
        )}
        {props.trap !== null && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 11, letterSpacing: '0.3em', color: '#888', marginBottom: 2 }}>
              TRAP
            </div>
            <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>
              {props.trap.toFixed(0)}
              <span style={{ display: 'flex', fontSize: 14, color: '#888', marginLeft: 4, alignSelf: 'flex-end', marginBottom: 4 }}>
                mph
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0a0a0a',
        color: '#fafafa',
        fontFamily: 'system-ui, sans-serif',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', fontSize: 16, letterSpacing: '0.4em', color: '#ff3030', marginBottom: 16 }}>
        UNDERGROUND GALLERY
      </div>
      <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>Race not found</div>
    </div>
  );
}
