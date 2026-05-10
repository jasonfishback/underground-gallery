// app/market/layout.tsx
//
// Members-only gate for the entire /market subtree. Anyone hitting any
// /market/* URL while not signed in gets bounced to the home page; pending
// members are sent to /pending.

import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/gates';

export const dynamic = 'force-dynamic';

export default async function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status === 'pending') redirect('/pending');
  if (ctx.status === 'rejected') redirect('/');

  return <>{children}</>;
}
