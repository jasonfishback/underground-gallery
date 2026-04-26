// lib/storage/r2.ts
//
// Cloudflare R2 client. R2 speaks the S3 protocol so we use the AWS SDK,
// just pointed at R2's endpoint. Server-side only — never expose these
// credentials to the client.

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME ?? "underground-gallery-photos";
const publicUrl = process.env.R2_PUBLIC_URL; // e.g. https://pub-abc123.r2.dev

if (!accountId || !accessKeyId || !secretAccessKey || !publicUrl) {
  // Don't throw at import time — this module may be imported in routes that
  // shouldn't fail just because R2 isn't configured locally yet.
  console.warn("[r2] missing env vars; uploads will fail until configured");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : "https://placeholder.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: accessKeyId ?? "",
    secretAccessKey: secretAccessKey ?? "",
  },
});

/**
 * Upload a buffer to R2. Returns the public URL.
 *
 * Key convention: `{photoId}/{variant}.webp`
 *   e.g. `Hk3xQwLm9p/full.webp` and `Hk3xQwLm9p/thumb.webp`
 *
 * `cacheControl` is set to immutable + 1 year because we never overwrite
 * a key — replacing a photo means a new photo ID and a new key.
 */
export async function r2Upload(args: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  if (!accountId) throw new Error("R2 not configured");

  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: args.key,
      Body: args.body,
      ContentType: args.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${publicUrl}/${args.key}`;
}

/**
 * Delete an object by key. Used when a user deletes a photo or replaces
 * their avatar.
 */
export async function r2Delete(key: string): Promise<void> {
  if (!accountId) throw new Error("R2 not configured");
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Extract the R2 object key from a stored public URL. */
export function r2KeyFromUrl(url: string): string | null {
  if (!publicUrl) return null;
  if (!url.startsWith(publicUrl)) return null;
  return url.slice(publicUrl.length + 1); // +1 for the slash
}
