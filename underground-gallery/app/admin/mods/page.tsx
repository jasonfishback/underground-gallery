import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { modCatalog, users } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { ModEditor } from './ModEditor';
import { colors, fonts, styles } from '@/lib/design';

export const dynamic = 'force-dynamic';

export default async function AdminModsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const [me] = await db
    .select({ isModerator: users.isModerator })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!me?.isModerator) redirect('/');

  const mods = await db
    .select()
    .from(modCatalog)
    .orderBy(asc(modCatalog.category), asc(modCatalog.name));

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/admin"
          style={{
            color: colors.textMuted,
            fontSize: 11,
            fontFamily: fonts.mono,
            letterSpacing: '0.2em',
            textDecoration: 'none',
          }}
        >
          {'< ADMIN'}
        </Link>
      </div>

      <h1
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: colors.accent,
          fontFamily: fonts.mono,
          fontWeight: 700,
          marginBottom: 24,
        }}
      >
        MOD CATALOG ({mods.length})
      </h1>

      <ModEditor mods={mods.map((m) => ({
        id: m.id,
        category: m.category,
        name: m.name,
        description: m.description,
        defaultHpGain: m.defaultHpGain ?? 0,
        defaultTorqueGain: m.defaultTorqueGain ?? 0,
        defaultWeightChange: m.defaultWeightChange ?? 0,
        active: m.active,
      }))} />
    </div>
  );
}