// components/market/MarketPhotoUploader.tsx
//
// Multi-photo uploader for listings. Lighter than the avatar/vehicle uploader
// (no cropper) because listings benefit from raw aspect ratios.

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Photo = { id: string; urlFull: string; urlThumb: string };

export function MarketPhotoUploader({
  listingId,
  initialPhotos,
  primaryPhotoId,
  maxPhotos,
}: {
  listingId: string;
  initialPhotos: Photo[];
  primaryPhotoId: string | null;
  maxPhotos: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('listingId', listingId);
    const res = await fetch('/api/market/photos/upload', { method: 'POST', body: fd });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error ?? 'Upload failed');
    }
    return json.photo as Photo;
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setError(null);
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        if (photos.length >= maxPhotos) {
          setError(`Limit: ${maxPhotos} photos per listing`);
          break;
        }
        const p = await uploadOne(f);
        setPhotos((cur) => [...cur, p]);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 8,
        }}
      >
        {photos.map((p) => (
          <div
            key={p.id}
            style={{
              aspectRatio: '4 / 3',
              background: `#0a0c12 url(${p.urlThumb}) center / cover no-repeat`,
              borderRadius: 8,
              border:
                p.id === primaryPhotoId
                  ? '2px solid #ff3030'
                  : '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
            }}
          >
            {p.id === primaryPhotoId && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  background: '#ff3030',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontWeight: 700,
                }}
              >
                MAIN
              </span>
            )}
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              aspectRatio: '4 / 3',
              border: '1px dashed rgba(255,255,255,0.2)',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              color: 'rgba(245,246,247,0.65)',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              letterSpacing: '0.18em',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {uploading ? 'UPLOADING…' : '+ ADD PHOTO'}
          </button>
        )}
      </div>
      <input
        type="file"
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && (
        <div style={{ fontSize: 12, color: '#ff5252' }}>{error}</div>
      )}
      <div style={{ fontSize: 11, color: 'rgba(245,246,247,0.45)' }}>
        Up to {maxPhotos} photos. JPEG, PNG, or WebP, max 12 MB each. First photo is the cover.
      </div>
    </div>
  );
}
