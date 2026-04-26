// lib/storage/image-processor.ts
//
// Takes a raw image buffer (already cropped client-side) and produces:
//   1. A "full" WebP at max 1920px wide, EXIF stripped, ~85% quality
//   2. A "thumb" WebP at max 400px wide, EXIF stripped, ~80% quality
//   3. The original EXIF as a JSON object (for admin DB storage only)
//
// Why we crop client-side and just resize/compress server-side:
//   - The cropper UI gives the user instant feedback (no upload-then-show)
//   - Server only needs to do the deterministic part (compress, strip EXIF)
//   - We auto-orient based on EXIF before stripping it, so phone photos
//     don't come out sideways

import sharp from "sharp";
import exifr from "exifr";

export type ProcessedImage = {
  full: Buffer;
  fullWidth: number;
  fullHeight: number;
  thumb: Buffer;
  thumbWidth: number;
  thumbHeight: number;
  exif: Record<string, unknown> | null;
};

/**
 * @param input  Raw image bytes (any format sharp accepts: jpeg/png/webp/heic/avif/gif)
 * @param shape  'square' for profiles (1:1) or 'wide' for vehicle hero (16:9)
 *               If the input is already cropped client-side, this is just a sanity check.
 */
export async function processUploadedImage(
  input: Buffer,
  shape: "square" | "wide" | "free",
): Promise<ProcessedImage> {
  // Read EXIF BEFORE we strip it (sharp's rotate() reads orientation from EXIF
  // and applies it, then we can safely drop the rest)
  let exif: Record<string, unknown> | null = null;
  try {
    const parsed = await exifr.parse(input, {
      // Default exifr config returns most useful tags including GPS
      // (which we keep in DB but not in the public file)
      gps: true,
    });
    exif = parsed ?? null;
  } catch {
    exif = null;
  }

  // Pipeline: auto-orient based on EXIF, then drop all metadata
  // .rotate() with no arg = use EXIF orientation, then strip it
  const base = sharp(input, { failOn: "none" }).rotate();

  // Build the full-size variant
  const fullPipeline = base
    .clone()
    .resize({
      width: 1920,
      height: shape === "wide" ? 1080 : shape === "square" ? 1920 : undefined,
      fit: shape === "free" ? "inside" : "cover",
      withoutEnlargement: true,
    })
    .webp({ quality: 85, effort: 4 });

  const { data: fullBuf, info: fullInfo } = await fullPipeline.toBuffer({
    resolveWithObject: true,
  });

  // Build the thumbnail variant (always square crop for consistent grid display)
  const thumbPipeline = base
    .clone()
    .resize({
      width: 400,
      height: 400,
      fit: "cover",
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 4 });

  const { data: thumbBuf, info: thumbInfo } = await thumbPipeline.toBuffer({
    resolveWithObject: true,
  });

  return {
    full: fullBuf,
    fullWidth: fullInfo.width,
    fullHeight: fullInfo.height,
    thumb: thumbBuf,
    thumbWidth: thumbInfo.width,
    thumbHeight: thumbInfo.height,
    exif,
  };
}

/**
 * Sanity ceiling — reject uploads larger than 25MB before they hit sharp.
 * After processing, our outputs are typically 100-300KB.
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
