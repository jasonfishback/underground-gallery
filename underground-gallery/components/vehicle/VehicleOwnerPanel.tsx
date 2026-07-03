"use client";

// components/vehicle/VehicleOwnerPanel.tsx
// Owner-only photo manager + mod manager for /v/[id].

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setPrimaryVehiclePhoto,
  deletePhoto,
} from "@/app/me/actions";
import { deleteMod } from "@/app/garage/actions";
import AddModModal from "@/components/garage/AddModModal";
import ModPreviewPanel from "@/components/mod-preview/ModPreviewPanel";
import { resizeImage } from "@/lib/client/photo-upload";
import { colors, fonts } from "@/lib/design";

type Photo = {
  id: string;
  urlFull: string;
  urlThumb: string | null;
};

type Mod = {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  hpDelta: number | null;
  notes: string | null;
};

type Props = {
  vehicleId: string;
  primaryPhotoId: string | null;
  photos: Photo[];
  mods: Mod[];
};


function formatModName(raw: string | null | undefined): string {
  if (!raw) return '';
  // Remove leading "mod_" / "mod-", convert underscores/dashes to spaces, title case
  return raw
    .replace(/^mod[_-]/i, '')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map(w => w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ')
    .trim();
}
export default function VehicleOwnerPanel({
  vehicleId,
  primaryPhotoId,
  photos: initialPhotos,
  mods: initialMods,
}: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [mods] = useState(initialMods);
  const [heroId, setHeroId] = useState<string | null>(primaryPhotoId);
  const [showModModal, setShowModModal] = useState(false);

  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showModPreview, setShowModPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const heroUrl =
    photos.find((p) => p.id === heroId)?.urlFull ?? photos[0]?.urlFull ?? null;

  const [actionPending, startAction] = useTransition();
  const uploading = uploadProgress !== null;

  async function uploadOne(original: File): Promise<{ ok: true; photo: { id: string; url: string; isHero: boolean } } | { ok: false; error: string }> {
    try {
      const file = await resizeImage(original);
      const fd = new FormData();
      fd.append("vehicleId", vehicleId);
      fd.append("file", file);
      const res = await fetch("/api/photos/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) return { ok: false, error: data?.error ?? "Upload failed." };
      return { ok: true, photo: { id: data.photo.id, url: data.photo.url, isHero: !!data.photo.isHero } };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Upload failed." };
    }
  }

  async function onFilesPicked(files: FileList | File[] | null) {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setUploadErr(null);
    setUploadProgress({ done: 0, total: arr.length });

    // Parallel uploader with concurrency cap of 3
    const CONCURRENCY = 3;
    let cursor = 0;
    let firstError: string | null = null;

    async function worker() {
      while (cursor < arr.length) {
        const myIdx = cursor++;
        const result = await uploadOne(arr[myIdx]);
        if (result.ok) {
          setPhotos((prev) => [
            ...prev,
            { id: result.photo.id, urlFull: result.photo.url, urlThumb: result.photo.url },
          ]);
          if (result.photo.isHero) setHeroId(result.photo.id);
        } else if (!firstError) {
          firstError = result.error;
        }
        setUploadProgress((p) => (p ? { done: p.done + 1, total: p.total } : null));
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, arr.length) }, worker));

    if (firstError) setUploadErr(firstError);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    onFilesPicked(e.dataTransfer.files);
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!dragOver) setDragOver(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleSetHero(photoId: string) {
    startAction(async () => {
      try {
        const res = await setPrimaryVehiclePhoto(vehicleId, photoId);
        if ((res as any)?.error) {
          alert((res as any).error);
          return;
        }
        setHeroId(photoId);
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Could not set hero photo.");
      }
    });
  }

  function handleDeletePhoto(photoId: string) {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    startAction(async () => {
      try {
        const res = await deletePhoto(photoId);
        if ((res as any)?.error) {
          alert((res as any).error);
          return;
        }
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (heroId === photoId) setHeroId(null);
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Could not delete photo.");
      }
    });
  }

  function handleDeleteMod(modId: string) {
    if (!confirm("Remove this mod?")) return;
    startAction(async () => {
      try {
        const res = await deleteMod(modId as any);
        if ((res as any)?.ok === false) {
          alert((res as any).error ?? "Could not delete mod.");
          return;
        }
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Could not delete mod.");
      }
    });
  }

  return (
    <div
      style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {/* PHOTOS */}
      <section className="ug-card" style={{ padding: 20 }}>
        <SectionHeader
          title="Photos"
          action={
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: "none" }}
                onChange={(e) => onFilesPicked(e.target.files)}
              />
              <button
                onClick={() => setShowModPreview(true)}
                disabled={uploading || !heroUrl}
                className="ug-btn ug-btn-ghost"
                title={heroUrl ? "AI mod mock-up" : "Add a photo first"}
                style={{ marginRight: 8 }}
              >
                ✨ PREVIEW MODS
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="ug-btn ug-btn-primary"
              >
                {uploadProgress
                  ? `UPLOADING ${uploadProgress.done} / ${uploadProgress.total}…`
                  : "+ ADD PHOTOS"}
              </button>
            </>
          }
        />

        {uploadErr && (
          <div className="ug-banner ug-banner-error" style={{ marginBottom: 12 }}>
            {uploadErr}
          </div>
        )}

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '40px 24px',
              background: dragOver ? 'rgba(255,48,48,0.12)' : 'rgba(255,255,255,0.02)',
              border: dragOver
                ? '2px dashed #ff3030'
                : '2px dashed rgba(255,255,255,0.18)',
              borderRadius: 14,
              color: 'rgba(245,246,247,0.85)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background 120ms ease, border-color 120ms ease',
              fontFamily: fonts.sans,
            }}
          >
            <div style={{ fontSize: 30, marginBottom: 10 }}>📷</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              {dragOver ? 'Drop to upload' : 'Drag photos here, or click to browse'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(245,246,247,0.55)' }}>
              JPEG / PNG / WebP up to 12 MB · multi-select supported · first one becomes the hero
            </div>
          </button>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 8,
            }}
          >
            {photos.map((p) => {
              const isHero = p.id === heroId;
              return (
                <div
                  key={p.id}
                  style={{
                    position: "relative",
                    aspectRatio: "4 / 3",
                    background: colors.bgElevated,
                    border: isHero
                      ? `1.5px solid ${colors.accent}`
                      : `1px solid ${colors.border}`,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.urlThumb ?? p.urlFull}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />

                  {isHero && (
                    <div
                      className="ug-mono"
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        background: colors.accent,
                        color: "#0a0a0a",
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.3em",
                      }}
                    >
                      ★ HERO
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      display: "flex",
                      gap: 4,
                      padding: 6,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                    }}
                  >
                    {!isHero && (
                      <button
                        onClick={() => handleSetHero(p.id)}
                        disabled={actionPending}
                        className="ug-mono"
                        style={{
                          padding: "5px 8px",
                          background: "rgba(0,0,0,0.6)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)" as any,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 6,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.2em",
                          cursor: "pointer",
                        }}
                        title="Set as hero photo"
                      >
                        ★ HERO
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      disabled={actionPending}
                      className="ug-mono"
                      style={{
                        padding: "5px 8px",
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)" as any,
                        color: "#ff8a8a",
                        border: `1px solid ${colors.accentBorder}`,
                        borderRadius: 6,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        cursor: "pointer",
                        marginLeft: "auto",
                      }}
                      title="Delete photo"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODS */}
      <section className="ug-card" style={{ padding: 20 }}>
        <SectionHeader
          title="Modifications"
          action={
            <button
              onClick={() => setShowModModal(true)}
              className="ug-btn ug-btn-primary"
            >
              + ADD MOD
            </button>
          }
        />

        {mods.length === 0 ? (
          <EmptyBox>
            No mods logged. Click <strong>+ ADD MOD</strong> to track suspension,
            tuning, intake, and more.
          </EmptyBox>
        ) : (
          <ul className="ug-list">
            {initialMods.map((m) => (
              <li
                key={m.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto",
                  gap: 16,
                  padding: "12px 16px",
                  alignItems: "center",
                }}
              >
                <span
                  className="ug-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    color: colors.textMuted,
                    fontWeight: 700,
                    minWidth: 80,
                  }}
                >
                  {m.category?.toUpperCase() ?? "OTHER"}
                </span>
                <span style={{ fontSize: 13, color: colors.text }}>
                  {m.brand ? <strong>{m.brand}</strong> : null}{" "}
                  {formatModName(m.name)}
                  {m.notes ? (
                    <span style={{ color: colors.textMuted }}> — {m.notes}</span>
                  ) : null}
                </span>
                <span
                  className="ug-list-meta"
                  style={{
                    color: m.hpDelta && m.hpDelta > 0 ? colors.accent : colors.textDim,
                  }}
                >
                  {m.hpDelta != null ? `${m.hpDelta > 0 ? "+" : ""}${m.hpDelta} hp` : ""}
                </span>
                <button
                  onClick={() => handleDeleteMod(m.id)}
                  disabled={actionPending}
                  className="ug-mono"
                  style={{
                    padding: "4px 8px",
                    background: "transparent",
                    color: colors.textMuted,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    fontSize: 9,
                    cursor: "pointer",
                  }}
                  title="Remove mod"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showModModal ? (
        <AddModModal
          vehicleId={vehicleId}
          open={showModModal}
          onClose={() => {
            setShowModModal(false);
            router.refresh();
          }}
        />
      ) : null}

      <ModPreviewPanel
        vehicleId={vehicleId}
        heroUrl={heroUrl}
        open={showModPreview}
        onClose={() => setShowModPreview(false)}
      />
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <h2
        className="ug-mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.4em",
          color: colors.textMuted,
          fontWeight: 700,
          margin: 0,
          textTransform: "uppercase",
        }}
      >
        // {title}
      </h2>
      {action}
    </div>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px dashed ${colors.border}`,
        borderRadius: 10,
        padding: 24,
        textAlign: "center",
        color: colors.textMuted,
        fontSize: 13,
        fontFamily: fonts.sans,
      }}
    >
      {children}
    </div>
  );
}

// resizeImage now lives in lib/client/photo-upload.ts (shared with the build
// composer and add-car wizard).
