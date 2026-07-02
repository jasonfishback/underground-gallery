// app/profile/page.tsx
//
// Real account page (replaced the launch-era "gallery opens soon" welcome
// screen). Shows identity, an inline bio editor, quick links into the rest
// of the app, and account info + sign-out.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth, signOut } from '@/auth';
import { db } from '@/lib/db';
import { users, vehicles, photos } from '@/lib/db/schema';
import { CallsignWithBadge } from '@/components/AdminBadge';
import ProfileEditor from '@/components/profile/ProfileEditor';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Profile · Underground Gallery',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  if (session.user.status !== 'active') redirect('/pending');

  const [me] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!me) redirect('/');

  const [avatar] = me.avatarPhotoId
    ? await db
        .select({ url: photos.urlThumb })
        .from(photos)
        .where(eq(photos.id, me.avatarPhotoId))
        .limit(1)
    : [];

  const carCount = (
    await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.userId, me.id))
  ).length;

  const memberSince = (me.approvedAt ?? me.createdAt).toLocaleDateString(
    'en-US',
    { month: 'short', year: 'numeric' },
  );

  return (
    <main
      style={{
        minHeight: '100vh',
        background: colors.bg,
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 64px' }}>
        {/* Identity header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginBottom: 32,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 999,
              flexShrink: 0,
              background: avatar?.url
                ? undefined
                : 'radial-gradient(circle at 30% 30%, rgba(255,42,42,0.25), rgba(255,255,255,0.04))',
              backgroundImage: avatar?.url ? `url(${avatar.url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: `1px solid ${colors.borderStrong}`,
              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              color: colors.accent,
            }}
          >
            {!avatar?.url && (me.callsign?.[0]?.toUpperCase() ?? '∕')}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="ug-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.4em',
                color: colors.accent,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              ∕∕ YOUR PROFILE
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 5vw, 38px)',
                margin: 0,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
              }}
            >
              <CallsignWithBadge
                callsign={me.callsign}
                isAdmin={me.isModerator}
                size="lg"
              />
            </h1>
            <div
              className="ug-mono"
              style={{
                marginTop: 8,
                fontSize: 10,
                letterSpacing: '0.18em',
                color: colors.textMuted,
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              {me.regionLabel && <span>{me.regionLabel.toUpperCase()}</span>}
              <span>MEMBER SINCE {memberSince.toUpperCase()}</span>
              <span>
                {carCount} {carCount === 1 ? 'CAR' : 'CARS'}
              </span>
            </div>
          </div>
          <Link
            href={me.callsign ? `/u/${me.callsign}` : '/me'}
            className="ug-btn ug-btn-ghost"
            style={{ marginLeft: 'auto', padding: '10px 16px', fontSize: 11 }}
          >
            View public profile →
          </Link>
        </header>

        {/* Bio editor */}
        <section className="ug-card" style={{ padding: 22, marginBottom: 20 }}>
          <ProfileEditor initialBio={me.bio ?? ''} />
        </section>

        {/* Quick links */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <QuickLink href="/me" label="MY GARAGE" hint={`${carCount} ${carCount === 1 ? 'car' : 'cars'}`} />
          <QuickLink href={me.callsign ? `/u/${me.callsign}/races` : '/race/history'} label="RACE LOG" hint="results" />
          <QuickLink href="/market/mine" label="MY LISTINGS" hint="marketplace" />
          <QuickLink href="/market/saved" label="WATCHLIST" hint="saved" />
          <QuickLink href="/invites" label="INVITES" hint="bring a friend" />
          {me.isModerator && <QuickLink href="/admin" label="ADMIN" hint="moderation" />}
        </section>

        {/* Account */}
        <section
          className="ug-card ug-mono"
          style={{
            padding: 20,
            fontSize: 11,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            color: colors.textMuted,
            letterSpacing: '0.05em',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: colors.textDim }}>EMAIL</span>
            <span style={{ overflowWrap: 'anywhere', textAlign: 'right' }}>{me.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textDim }}>STATUS</span>
            <span style={{ color: colors.success }}>ACTIVE</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textDim }}>TIER</span>
            <span style={{ textTransform: 'uppercase' }}>{me.tier}</span>
          </div>
        </section>

        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button type="submit" className="ug-btn ug-btn-ghost">
            SIGN OUT
          </button>
        </form>

        {/* Footer */}
        <footer
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            fontFamily: fonts.mono,
            fontSize: 9,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: colors.textDim,
          }}
        >
          <div>© MMXXVI · UNDERGROUND GALLERY</div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ color: colors.textMuted, textDecoration: 'none' }}>
              PRIVACY
            </a>
            <a href="/terms" style={{ color: colors.textMuted, textDecoration: 'none' }}>
              TERMS
            </a>
            <a
              href="mailto:info@undergroundgallery.ai"
              style={{ color: colors.textMuted, textDecoration: 'none' }}
            >
              CONTACT
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function QuickLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="ug-card"
      style={{
        padding: '16px 16px 14px',
        textDecoration: 'none',
        display: 'block',
      }}
    >
      <div
        className="ug-mono"
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: colors.text,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="ug-mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.16em',
          color: colors.textDim,
          textTransform: 'uppercase',
        }}
      >
        {hint} →
      </div>
    </Link>
  );
}
