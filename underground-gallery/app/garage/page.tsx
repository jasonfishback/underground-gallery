import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GaragePage() {
  const session = await auth();
  if (!session?.user) redirect('/');
  if (session.user.status !== 'active') redirect('/pending');
  redirect('/me');
}