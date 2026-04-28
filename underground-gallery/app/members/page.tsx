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
          <div style={{ fontSize: 10, letterSpacing: '0.4em', color: colors.accent, marginBottom: 8 }}>
            ROSTER
          </div>
          <h1 style={{ fontSize: 36, margin: 0, letterSpacing: '0.02em' }}>The Gallery.</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
            {members.length} active {members.length === 1 ? 'member' : 'members'}.
          </p>
        </header>

        {members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: colors.textMuted }}>
            No members yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {members.map((m) => (
              <Link
                key={m.id}
                href={`/u/${m.callsign}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  background: '#111',
                  border: `0.5px solid ${m.isModerator ? colors.accent : colors.border}`,
                  color: colors.text,
                  textDecoration: 'none',
                  fontFamily: fonts.mono,
                }}
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt=""
                    style={{ width: 48, height: 48, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: '#1a1a1a',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: colors.textDim,
                    }}
                  >
                    {(m.callsign ?? '?')[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <CallsignWithBadge
                      callsign={m.callsign}
                      isAdmin={m.isModerator}
                      size="sm"
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: colors.textMuted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.regionLabel ?? '—'}
                  </div>
                  <div style={{ fontSize: 9, color: colors.textDim, marginTop: 2, letterSpacing: '0.2em' }}>
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
