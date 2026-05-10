// app/api/market/photos/upload/route.ts
//
// Listing photo upload endpoint. Accepts multipart/form-data:
//   - file (Blob)
//   - listingId (string) — must be a draft/active listing owned by the user
//
// Returns the new photo record. The listing's primary_photo_id is set to
// this photo if the listing has none yet.

import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { listings, photos } from '@/lib/db/schema';
import { r2Upload } from '@/lib/storage/r2';
import { randomUUID } from 'crypto';
import { MAX_PHOTOS_PER_LISTING } from '@/lib/market/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
    }

    const form = await req.formData();
    const listingId = form.get('listingId');
    const file = form.get('file');

    if (typeof listingId !== 'string' || !listingId) {
      return NextResponse.json({ ok: false, error: 'Missing listingId.' }, { status: 400 });
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: 'Missing file.' }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'File must be 1 byte to 12 MB.' }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'Only JPEG, PNG, or WebP images allowed.' },
        { status: 400 },
      );
    }

    const [listing] = await db
      .select({ id: listings.id, sellerId: listings.sellerId, primaryPhotoId: listings.primaryPhotoId })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!listing) {
      return NextResponse.json({ ok: false, error: 'Listing not found.' }, { status: 404 });
    }
    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ ok: false, error: 'Not your listing.' }, { status: 403 });
    }

    // Cap photos per listing
    const [c] = await db
      .select({ n: count() })
      .from(photos)
      .where(and(eq(photos.subjectType, 'listing'), eq(photos.subjectId, listingId)));
    if (Number(c?.n ?? 0) >= MAX_PHOTOS_PER_LISTING) {
      return NextResponse.json(
        { ok: false, error: `Listings are limited to ${MAX_PHOTOS_PER_LISTING} photos.` },
        { status: 400 },
      );
    }

    const ext =
      file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const photoId = randomUUID();
    const key = `listings/${listingId}/${photoId}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const url = await r2Upload({ key, body: buf, contentType: file.type });

    const sortOrder = Number(c?.n ?? 0);

    await db.insert(photos).values({
      id: photoId,
      uploaderId: session.user.id,
      subjectType: 'listing',
      subjectId: listingId,
      urlFull: url,
      urlThumb: url,
      width: 0,
      height: 0,
      exifJson: null,
      sortOrder,
    } as any);

    if (!listing.primaryPhotoId) {
      await db
        .update(listings)
        .set({ primaryPhotoId: photoId, updatedAt: new Date() })
        .where(eq(listings.id, listingId));
    }

    return NextResponse.json({
      ok: true,
      photo: { id: photoId, urlFull: url, urlThumb: url, isHero: !listing.primaryPhotoId },
    });
  } catch (err) {
    console.error('[/api/market/photos/upload] failed', err);
    return NextResponse.json(
      { ok: false, error: 'Upload failed: ' + (err instanceof Error ? err.message : String(err)) },
      { status: 500 },
    );
  }
}
