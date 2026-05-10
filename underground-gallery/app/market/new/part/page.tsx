// app/market/new/part/page.tsx — create a part listing.

import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/gates';
import { PartListingForm } from '@/components/market/PartListingForm';

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
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: '#ff3030',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 700,
        }}
      >
        UNDERGROUND · LIST A PART
      </div>
      <h1 style={{ fontSize: 28, margin: '8px 0 4px' }}>What's the part?</h1>
      <p style={{ color: 'rgba(245,246,247,0.6)', marginBottom: 24, fontSize: 14 }}>
        We'll save a draft. You'll add photos and publish on the next screen.
      </p>
      <PartListingForm mode="create" />
    </main>
  );
}
