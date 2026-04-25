import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// GET /api/waitlist
// Returns the current public-facing waitlist count.
// Real count from KV + a baseline from env (so the displayed number is credible
// from day one, then ticks up with real applications).

export const revalidate = 30; // cache for 30s at the edge

export async function GET(_req: NextRequest) {
  try {
    const baseline = parseInt(process.env.NEXT_PUBLIC_WAITLIST_BASELINE || '114', 10);
    const real = (await kv.get<number>('applicants:count')) || 0;
    return NextResponse.json({ count: baseline + real, real, baseline });
  } catch (err) {
    console.error('waitlist count error', err);
    const baseline = parseInt(process.env.NEXT_PUBLIC_WAITLIST_BASELINE || '114', 10);
    return NextResponse.json({ count: baseline, real: 0, baseline });
  }
}
