// app/market/new/part/page.tsx — create a part listing.

import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/gates';
import { PartListingForm } from '@/components/market/PartListingForm';
import { colors, fonts } from '@/lib/design';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'List a part' };

export default async function NewPartListingPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  return (
    <main
      style={{
        padding: '32px 24px 64px',
        maxWidth: 880,
        margin: '0 auto',
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: colors.accent,
          fontFamily: fonts.mono,
          fontWeight: 700,
        }}
      >
        ∕∕ UNDERGROUND · LIST A PART
      </div>
      <h1 style={{ fontSize: 28, margin: '8px 0 4px' }}>What's the part?</h1>
      <p style={{ color: colors.textMuted, marginBottom: 24, fontSize: 14 }}>
        We'll save a draft. You'll add photos and publish on the next screen.
      </p>
      <PartListingForm mode="create" />
    </main>
  );
}
