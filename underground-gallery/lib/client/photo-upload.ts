// lib/client/photo-upload.ts
// Client-side photo helpers shared by the Build Log composer, the Add Car
// wizard photo step, and the vehicle owner panel. Browser-only (canvas).

/**
 * Resize an image client-side so uploads fit Vercel's 4.5MB function body
 * limit. Max 2048px on the longest edge, JPEG quality 0.85. Small non-HEIC
 * files pass through untouched.
 */
export async function resizeImage(file: File): Promise<File> {
  if (
    file.size < 3_500_000 &&
    file.type !== "image/heic" &&
    file.type !== "image/heif"
  ) {
    return file;
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = (e) => reject(e);
      i.src = url;
    });

    const MAX = 2048;
    let { width, height } = img;
    if (width > MAX || height > MAX) {
      const ratio = Math.min(MAX / width, MAX / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type UploadedPhoto = { id: string; url: string; isHero: boolean };
export type UploadResult =
  | { ok: true; photo: UploadedPhoto }
  | { ok: false; error: string };

/** Resize + POST one photo to /api/photos/upload. */
export async function uploadVehiclePhoto(
  original: File,
  vehicleId: string,
  buildEntryId?: string,
): Promise<UploadResult> {
  try {
    const file = await resizeImage(original);
    const fd = new FormData();
    fd.append("vehicleId", vehicleId);
    if (buildEntryId) fd.append("buildEntryId", buildEntryId);
    fd.append("file", file);
    const res = await fetch("/api/photos/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? "Upload failed." };
    }
    return {
      ok: true,
      photo: {
        id: data.photo.id,
        url: data.photo.url,
        isHero: !!data.photo.isHero,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

/**
 * Upload many photos with a concurrency cap. Calls onProgress after each
 * finishes. Returns successes and the first error (if any).
 */
export async function uploadVehiclePhotos(
  files: File[],
  vehicleId: string,
  opts?: {
    buildEntryId?: string;
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<{ photos: UploadedPhoto[]; firstError: string | null }> {
  const concurrency = opts?.concurrency ?? 3;
  const photos: UploadedPhoto[] = [];
  let firstError: string | null = null;
  let cursor = 0;
  let done = 0;

  async function worker() {
    while (cursor < files.length) {
      const myIdx = cursor++;
      const result = await uploadVehiclePhoto(
        files[myIdx],
        vehicleId,
        opts?.buildEntryId,
      );
      if (result.ok) photos.push(result.photo);
      else if (!firstError) firstError = result.error;
      done++;
      opts?.onProgress?.(done, files.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, files.length) }, worker),
  );
  return { photos, firstError };
}
