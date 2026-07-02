"use client";

// components/build/BuildEntryComposer.tsx
//
// The "log a build update" modal. Photos-FIRST: the photo tray sits at the
// top so the flow matches how people actually document work — shoot it,
// caption it, post it. Staged photos upload in parallel (cap 3) after the
// entry row is created, so posting feels instant.
//
// Also handles editing an existing entry (title/category/date/notes/cost,
// remove existing photos, add new ones).

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBuildEntry,
  updateBuildEntry,
} from "@/app/garage/build-actions";
import { deletePhoto } from "@/app/me/actions";
import { BUILD_CATEGORIES, type BuildCategory } from "@/lib/db/schema";
import { uploadVehiclePhotos } from "@/lib/client/photo-upload";
import { colors, fonts } from "@/lib/design";

export type ComposerInitial = {
  id: string;
  title: string;
  category: string | null;
  body: string | null;
  entryDate: string; // YYYY-MM-DD
  costCents: number | null;
  photos: { id: string; url: string }[];
};

type Props = {
  vehicleId: string;
  open: boolean;
  onClose: () => void;
  /** When set, the composer edits this entry instead of creating a new one. */
  initial?: ComposerInitial | null;
};

type Staged = { file: File; previewUrl: string };

function todayLocalISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BuildEntryComposer({
  vehicleId,
  open,
  onClose,
  initial,
}: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<BuildCategory | null>(null);
  const [body, setBody] = useState("");
  const [entryDate, setEntryDate] = useState(todayLocalISO());
  const [costText, setCostText] = useState("");

  const [staged, setStaged] = useState<Staged[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<
    { id: string; url: string }[]
  >([]);

  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Seed / reset state when the modal opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setProgress(null);
    setStaged([]);
    if (initial) {
      setTitle(initial.title);
      setCategory((initial.category as BuildCategory) ?? null);
      setBody(initial.body ?? "");
      setEntryDate(initial.entryDate);
      setCostText(
        initial.costCents != null ? String(initial.costCents / 100) : "",
      );
      setExistingPhotos(initial.photos);
    } else {
      setTitle("");
      setCategory(null);
      setBody("");
      setEntryDate(todayLocalISO());
      setCostText("");
      setExistingPhotos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  // Revoke object URLs when unmounting/clearing.
  useEffect(() => {
    return () => {
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const costCents = useMemo(() => {
    const t = costText.replace(/[$,\s]/g, "").trim();
    if (!t) return null;
    const n = Number(t);
    if (!isFinite(n) || n < 0) return NaN;
    return Math.round(n * 100);
  }, [costText]);

  if (!open) return null;

  function stageFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setStaged((prev) => [
      ...prev,
      ...arr.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  }

  function unstage(idx: number) {
    setStaged((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function removeExistingPhoto(photoId: string) {
    if (!confirm("Remove this photo from the entry AND the gallery?")) return;
    const res = await deletePhoto(photoId);
    if ((res as any)?.ok === false) {
      setError((res as any).error ?? "Could not delete photo.");
      return;
    }
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function handlePost() {
    setError(null);
    if (!title.trim()) {
      setError("Give this update a title.");
      return;
    }
    if (Number.isNaN(costCents)) {
      setError("Cost doesn't look like a number.");
      return;
    }

    setPosting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        body: body.trim() || undefined,
        entryDate,
        costCents: costCents as number | null,
      };

      let entryId: string;
      if (isEdit && initial) {
        const res = await updateBuildEntry(initial.id, payload);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        entryId = initial.id;
      } else {
        const res = await createBuildEntry(vehicleId, payload);
        if (!res.ok || !res.data) {
          setError(res.ok ? "Could not create entry." : res.error);
          return;
        }
        entryId = res.data.entryId;
      }

      if (staged.length > 0) {
        setProgress({ done: 0, total: staged.length });
        const { firstError } = await uploadVehiclePhotos(
          staged.map((s) => s.file),
          vehicleId,
          {
            buildEntryId: entryId,
            onProgress: (done, total) => setProgress({ done, total }),
          },
        );
        if (firstError) {
          // Entry is saved; photos partially failed. Surface but don't block.
          setError(`Entry saved, but a photo failed: ${firstError}`);
          setProgress(null);
          router.refresh();
          return;
        }
      }

      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setStaged([]);
      onClose();
      router.refresh();
    } catch (err) {
      console.error("[BuildEntryComposer] post failed", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPosting(false);
      setProgress(null);
    }
  }

  const tileStyle: React.CSSProperties = {
    position: "relative",
    aspectRatio: "1 / 1",
    borderRadius: 10,
    overflow: "hidden",
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.03)",
  };

  return (
    <div className="ug-modal-backdrop" onClick={posting ? undefined : onClose}>
      <div
        className="ug-modal"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h2
            className="ug-mono"
            style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "0.06em" }}
          >
            {isEdit ? "// EDIT UPDATE" : "// LOG BUILD UPDATE"}
          </h2>
          <button
            onClick={onClose}
            disabled={posting}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${colors.border}`,
              borderRadius: 999,
              width: 32,
              height: 32,
              color: colors.textMuted,
              fontSize: 16,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* ── PHOTOS FIRST ─────────────────────────────────────────── */}
        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            stageFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            stageFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {existingPhotos.map((p) => (
            <div key={p.id} style={tileStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={() => removeExistingPhoto(p.id)}
                disabled={posting}
                aria-label="Remove photo"
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: "none",
                  background: "rgba(0,0,0,0.7)",
                  color: "#ff8a8a",
                  fontSize: 12,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}

          {staged.map((s, i) => (
            <div key={s.previewUrl} style={tileStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.previewUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={() => unstage(i)}
                disabled={posting}
                aria-label="Remove photo"
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: "none",
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Camera tile (mobile shoots straight to camera) */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={posting}
            style={{
              ...tileStyle,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
              border: `1px dashed ${colors.accentBorder}`,
              background: colors.accentSoft,
              color: colors.accent,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>📸</span>
            <span
              className="ug-mono"
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em" }}
            >
              CAMERA
            </span>
          </button>

          {/* Library tile */}
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            disabled={posting}
            style={{
              ...tileStyle,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              cursor: "pointer",
              border: `1px dashed rgba(255,255,255,0.25)`,
              color: colors.textMuted,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>🖼️</span>
            <span
              className="ug-mono"
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em" }}
            >
              LIBRARY
            </span>
          </button>
        </div>

        {/* ── Title ────────────────────────────────────────────────── */}
        <label className="ug-label">What did you do?</label>
        <input
          type="text"
          autoFocus={!isEdit}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Coilovers installed, First start after rebuild…"
          maxLength={120}
          className="ug-input ug-input-lg"
        />

        {/* ── Category chips ───────────────────────────────────────── */}
        <div style={{ marginTop: 16 }}>
          <label className="ug-label">Category</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {BUILD_CATEGORIES.map((c) => {
              const selected = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(selected ? null : c)}
                  disabled={posting}
                  className="ug-mono"
                  style={{
                    padding: "7px 12px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 140ms ease",
                    background: selected
                      ? "linear-gradient(180deg, #ff3a3a 0%, #e01818 100%)"
                      : "rgba(255,255,255,0.03)",
                    color: selected ? "#fff" : colors.textMuted,
                    border: selected
                      ? "1px solid rgba(255,255,255,0.16)"
                      : `1px solid ${colors.border}`,
                    boxShadow: selected
                      ? "0 6px 18px -6px rgba(255,42,42,0.55)"
                      : "none",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Date + cost ──────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <label className="ug-label">When</label>
            <input
              type="date"
              value={entryDate}
              max={todayLocalISO()}
              onChange={(e) => setEntryDate(e.target.value)}
              className="ug-input"
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div>
            <label className="ug-label">Cost (optional)</label>
            <input
              type="text"
              inputMode="decimal"
              value={costText}
              onChange={(e) => setCostText(e.target.value)}
              placeholder="$0"
              className="ug-input"
            />
          </div>
        </div>

        {/* ── Notes ────────────────────────────────────────────────── */}
        <div style={{ marginTop: 16 }}>
          <label className="ug-label">Notes (optional)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Parts, part numbers, what went wrong, what you'd do differently…"
            rows={4}
            maxLength={5000}
            className="ug-input"
            style={{ resize: "vertical", minHeight: 90, fontFamily: fonts.sans }}
          />
        </div>

        {error && (
          <div className="ug-banner ug-banner-error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        {/* ── Post ─────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            flexDirection: "row-reverse",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handlePost}
            disabled={posting}
            className="ug-btn ug-btn-primary ug-btn-block"
            style={{ flex: 1, minWidth: 200 }}
          >
            {progress
              ? `UPLOADING ${progress.done} / ${progress.total}…`
              : posting
                ? "Posting…"
                : isEdit
                  ? "Save changes"
                  : staged.length > 0
                    ? `Post update · ${staged.length} photo${staged.length === 1 ? "" : "s"}`
                    : "Post update"}
          </button>
          <button
            onClick={onClose}
            disabled={posting}
            className="ug-btn ug-btn-text"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
