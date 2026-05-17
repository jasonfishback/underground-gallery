// components/PhotoUploader.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { colors, fonts } from "@/lib/design";

type Props = {
  subjectType: "user" | "vehicle";
  subjectId: string;
  shape: "square" | "wide";
  buttonLabel?: string;
  onUploaded?: (photo: { id: string; urlFull: string; urlThumb: string }) => void;
};

/**
 * Two-stage flow:
 *   1. User picks a file → opens a modal with cropper
 *   2. User drags/zooms → confirms → we crop client-side, POST as FormData
 *
 * The crop happens on a canvas in the browser (no server round-trip for the preview).
 * We send the cropped result, not the original, so server-side processing only
 * has to compress + strip EXIF, not re-crop.
 */
export function PhotoUploader(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspect = props.shape === "square" ? 1 : 16 / 9;

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > 25 * 1024 * 1024) {
      setError("Image is too large (max 25MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
    // Reset input so re-picking the same file fires onChange again
    e.target.value = "";
  }

  const onCropComplete = useCallback((_: Area, areaPx: Area) => {
    setCroppedArea(areaPx);
  }, []);

  function cancel() {
    setSrc(null);
    setCroppedArea(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  }

  async function confirm() {
    if (!src || !croppedArea) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await cropImageToBlob(src, croppedArea);
      const fd = new FormData();
      fd.append("file", blob, "upload.jpg");
      fd.append("subjectType", props.subjectType);
      fd.append("subjectId", props.subjectId);
      fd.append("shape", props.shape);
      const res = await fetch("/api/photos", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Upload failed");
        return;
      }
      const data = await res.json();
      props.onUploaded?.(data);
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onFileChosen}
      />
      <button
        type="button"
        onClick={pickFile}
        className="ug-card ug-mono"
        style={{
          padding: "14px 20px",
          color: colors.accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          cursor: "pointer",
          border: `1px dashed ${colors.accentBorder}`,
          background: colors.accentSoft,
          fontFamily: fonts.mono,
        }}
      >
        {props.buttonLabel ?? "+ Add photo"}
      </button>

      {src && (
        <div
          className="ug-modal-backdrop"
          style={{
            background: "rgba(0,0,0,0.92)",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "90vw",
              maxWidth: 600,
              aspectRatio: String(aspect),
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${colors.border}`,
            }}
          >
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid
            />
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            style={{ width: 240, marginTop: 20 }}
          />
          {error && (
            <div
              className="ug-banner ug-banner-error"
              style={{ marginTop: 12 }}
            >
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              type="button"
              onClick={cancel}
              disabled={uploading}
              className="ug-btn ug-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={uploading || !croppedArea}
              className="ug-btn ug-btn-primary"
            >
              {uploading ? "Uploading…" : "Upload →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Crop a data URL image to a Blob using a canvas.
async function cropImageToBlob(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas not available");
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}
