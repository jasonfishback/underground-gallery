// app/market/messages/[threadId]/page.tsx — one thread.
//
// threadId is encoded as `<listingId>-<otherUserId>`. We split on the first
// hyphen that produces a valid listing id (12 chars in our nanoid alphabet).
// Cleaner: splice at length-of-listingId; we know nanoid alphabet is fixed.

import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/lib/db';
import { listings, users } from '@/lib/db/schema';
import { getAuthContext } from '@/lib/auth/gates';
import { getThreadMessages } from '@/lib/market/queries';
import { ThreadView } from '@/components/market/ThreadView';

export const dynamic = 'force-dynamic';

function parseThreadId(raw: string): { listingId: string; otherUserId: string } | null {
  // Listing IDs from nanoid are 12 chars; the rest of the string is the user id
  if (raw.length < 14) return null;
  const listingId = raw.slice(0, 12);
  const sep = raw.charAt(12);
  if (sep !== '-') return null;
  const otherUserId = raw.slice(13);
  if (!otherUserId) return null;
  return { listingId, otherUserId };
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/');
  if (ctx.status !== 'active') redirect('/pending');

  const { threadId } = await params;
  const parsed = parseThreadId(threadId);
  if (!parsed) notFound();

  // Verify the listing exists and the user is allowed to talk on this thread
  const [l] = await db
    .select({
      id: listings.id,
      title: listings.title,
      sellerId: listings.sellerId,
      status: listings.status,
    })
    .from(listings)
    .where(eq(listings.id, parsed.listingId))
    .limit(1);
  if (!l) notFound();

  // Allowed if: I'm the seller, OR I'm messaging the seller
  const iAmSeller = l.sellerId === ctx.userId;
  const otherIsSeller = l.sellerId === parsed.otherUserId;
  if (!iAmSeller && !otherIsSeller) {
    // The user is not a participant. Block.
    notFound();
  }

  const [other] = await db
    .select({ callsign: users.callsign })
    .from(users)
    .where(eq(users.id, parsed.otherUserId))
    .limit(1);

  const messages = await getThreadMessages(ctx.userId, parsed.listingId, parsed.otherUserId);

  return (
    <main
      style={{
        padding: '24px 24px 40px',
        maxWidth: 880,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <Link
          href="/market/messages"
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            color: 'rgba(245,246,247,0.55)',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            textDecoration: 'none',
          }}
        >
          ← ALL CONVERSATIONS
        </Link>
      </div>

      <ThreadView
        listingId={l.id}
        meId={ctx.userId}
        otherId={parsed.otherUserId}
        otherCallsign={other?.callsign ?? null}
        initialMessages={messages}
        pusherKey={process.env.NEXT_PUBLIC_PUSHER_KEY ?? null}
        pusherCluster={process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? null}
      />
    </main>
  );
}
