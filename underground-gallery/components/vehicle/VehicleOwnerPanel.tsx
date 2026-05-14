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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [actionPending, startAction] = useTransition();

  async function onFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadErr(null);
    setUploading(true);

    try {
      for (const original of Array.from(files)) {
        const file = await resizeImage(original);
        const fd = new FormData();
        fd.append("vehicleId", vehicleId);
        fd.append("file", file);

        const res = await fetch("/api/photos/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          setUploadErr(data?.error ?? "Upload failed.");
          break;
        }
        setPhotos((prev) => [
          ...prev,
          { id: data.photo.id, urlFull: data.photo.url, urlThumb: data.photo.url },
        ]);
        if (data.photo.isHero) {
          setHeroId(data.photo.id);
        }
      }
    } catch (err) {
      console.error(err);
      setUploadErr("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    }
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
    <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
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
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="ug-btn ug-btn-primary"
              >
                {uploading ? "UPLOADING…" : "+ ADD PHOTOS"}
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
          <EmptyBox>
            No photos yet. Click <strong>+ ADD PHOTOS</strong> to upload. Your
            first photo becomes the hero automatically.
          </EmptyBox>
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

// Resize image client-side to fit Vercel 4.5MB function body limit.
// Targets max 2048px on the longest edge, JPEG quality 0.85.
async function resizeImage(file: File): Promise<File> {
  // If the file is already small and not HEIC, skip resize
  if (file.size < 3_500_000 && file.type !== "image/heic" && file.type !== "image/heif") {
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
