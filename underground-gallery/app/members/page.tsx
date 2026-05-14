// app/members/page.tsx
//
// Browse all active members. Sorted with admins/moderators first, then
// most recent. Click into any profile.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, desc, sql, and, isNotNull } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, vehicles, photos } from '@/lib/db/schema';
import { CallsignWithBadge } from '@/components/AdminBadge';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const members = await db
    .select({
      id: users.id,
      callsign: users.callsign,
      bio: users.bio,
      regionLabel: users.regionLabel,
      isModerator: users.isModerator,
      avatarUrl: sql<string | null>`(SELECT ph.url_thumb FROM vehicles veh LEFT JOIN photos ph ON ph.id = veh.primary_photo_id WHERE veh.user_id = users.id AND veh.is_primary = true ORDER BY veh.created_at DESC LIMIT 1)`,
      vehicleCount: sql<number>`(SELECT COUNT(*) FROM ${vehicles} WHERE ${vehicles.userId} = ${users.id})::int`,
    })
    .from(users)
    .where(and(eq(users.status, 'active'), isNotNull(users.callsign)))
    .orderBy(desc(users.isModerator), desc(users.createdAt));

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: fonts.sans }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <header style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              letterSpacing: '0.4em',
              color: colors.accent,
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            ∕∕ ROSTER
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 44px)', margin: 0, letterSpacing: '-0.02em', fontWeight: 800 }}>
            The Gallery.
          </h1>
          <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 8, fontFamily: fonts.mono, letterSpacing: '0.12em' }}>
            {members.length} active {members.length === 1 ? 'member' : 'members'}
          </p>
        </header>

        {members.length === 0 ? (
          <div className="ug-card" style={{ textAlign: 'center', padding: 64, color: colors.textMuted }}>
            No members yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {members.map((m) => (
              <Link
                key={m.id}
                href={`/u/${m.callsign}`}
                className="ug-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  color: colors.text,
                  textDecoration: 'none',
                  fontFamily: fonts.sans,
                  borderColor: m.isModerator ? colors.accentBorder : undefined,
                  boxShadow: m.isModerator
                    ? '0 0 0 1px rgba(255,42,42,0.18) inset, 0 8px 24px rgba(255,42,42,0.10)'
                    : undefined,
                }}
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt=""
                    style={{
                      width: 52,
                      height: 52,
                      objectFit: 'cover',
                      flexShrink: 0,
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 700,
                      color: colors.text,
                      background:
                        'linear-gradient(135deg, rgba(255,42,42,0.18) 0%, rgba(255,255,255,0.04) 100%)',
                      border: `1px solid ${colors.border}`,
                      fontFamily: fonts.mono,
                    }}
                  >
                    {(m.callsign ?? '?')[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CallsignWithBadge
                      callsign={m.callsign}
                      isAdmin={m.isModerator}
                      size="sm"
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.regionLabel ?? '—'}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: colors.textDim,
                      marginTop: 4,
                      letterSpacing: '0.22em',
                      fontFamily: fonts.mono,
                      fontWeight: 600,
                    }}
                  >
                    {m.vehicleCount} {m.vehicleCount === 1 ? 'CAR' : 'CARS'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
