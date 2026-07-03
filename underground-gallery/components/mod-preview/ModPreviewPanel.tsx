"use client";

// components/mod-preview/ModPreviewPanel.tsx
//
// Owner-only "Preview mods" modal. Pick a visual mod (wheels / stance / carbon
// / finish); we run an identity-preserving AI edit on the car's hero photo and
// show a before/after. Beta: free while we dial in output quality.

import { useMemo, useState } from "react";
import {
  MOD_PRESETS,
  type ModPreset,
  type ModPreviewCategory,
} from "@/lib/mod-preview/presets";
import { colors, fonts } from "@/lib/design";

type Props = {
  vehicleId: string;
  heroUrl: string | null;
  open: boolean;
  onClose: () => void;
};

const CATEGORIES: (ModPreviewCategory | "All")[] = [
  "All",
  "Wheels",
  "Stance",
  "Carbon",
  "Finish",
];

export default function ModPreviewPanel({ vehicleId, heroUrl, open, onClose }: Props) {
  const [cat, setCat] = useState<(ModPreviewCategory | "All")>("All");
  const [active, setActive] = useState<ModPreset | null>(null);
  const [rendering, setRendering] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const presets = useMemo(
    () => (cat === "All" ? MOD_PRESETS : MOD_PRESETS.filter((p) => p.category === cat)),
    [cat],
  );

  if (!open) return null;

  async function run(preset: ModPreset) {
    if (rendering) return;
    setActive(preset);
    setResultUrl(null);
    setError(null);
    setRendering(true);
    try {
      const res = await fetch("/api/mod-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, presetId: preset.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Preview failed.");
        return;
      }
      setResultUrl(data.url);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setRendering(false);
    }
  }

  return (
    <div className="ug-modal-backdrop" onClick={rendering ? undefined : onClose}>
      <div
        className="ug-modal"
        style={{ maxWidth: 760 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            gap: 12,
          }}
        >
          <div>
            <h2
              className="ug-mono"
              style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "0.06em" }}
            >
              // PREVIEW MODS
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: colors.accentSoft,
                  border: `1px solid ${colors.accentBorder}`,
                  color: "#ff8a8a",
                  letterSpacing: "0.2em",
                  verticalAlign: "middle",
                }}
              >
                BETA
              </span>
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: colors.textMuted }}>
              AI mock-up on your car&apos;s photo. Visual only — not a fitment guide.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={rendering}
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
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {!heroUrl ? (
          <div
            className="ug-card"
            style={{
              padding: 32,
              textAlign: "center",
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            Add a photo of this car first — the preview edits your hero shot. A
            clean side profile works best.
          </div>
        ) : (
          <>
            {/* Before / after */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: resultUrl || rendering ? "1fr 1fr" : "1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Frame label="STOCK" url={heroUrl} />
              {(resultUrl || rendering) && (
                <Frame
                  label={active ? active.label.toUpperCase() : "PREVIEW"}
                  url={resultUrl}
                  loading={rendering}
                  accent
                />
              )}
            </div>

            {error && (
              <div className="ug-banner ug-banner-error" style={{ marginBottom: 14 }}>
                {error}
              </div>
            )}

            {resultUrl && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <a
                  href={resultUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ug-btn ug-btn-ghost"
                  style={{ padding: "10px 16px", fontSize: 11 }}
                >
                  ↓ Download
                </a>
                <button
                  onClick={() => {
                    setResultUrl(null);
                    setActive(null);
                  }}
                  className="ug-btn ug-btn-text"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Category filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {CATEGORIES.map((c) => {
                const sel = cat === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    disabled={rendering}
                    className="ug-mono"
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      background: sel
                        ? "linear-gradient(180deg, #ff3a3a 0%, #e01818 100%)"
                        : "rgba(255,255,255,0.03)",
                      color: sel ? "#fff" : colors.textMuted,
                      border: sel
                        ? "1px solid rgba(255,255,255,0.16)"
                        : `1px solid ${colors.border}`,
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Preset tiles */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 8,
              }}
            >
              {presets.map((p) => {
                const isActive = active?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => run(p)}
                    disabled={rendering}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 10,
                      textAlign: "left",
                      cursor: rendering ? "wait" : "pointer",
                      background: isActive ? colors.accentSoft : "rgba(255,255,255,0.03)",
                      border: isActive
                        ? `1px solid ${colors.accentBorder}`
                        : `1px solid ${colors.border}`,
                      color: colors.text,
                      fontFamily: fonts.sans,
                      transition: "background 120ms ease, border-color 120ms ease",
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{p.glyph}</span>
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12.5,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.label}
                      </span>
                      <span
                        className="ug-mono"
                        style={{
                          fontSize: 8.5,
                          letterSpacing: "0.16em",
                          color: colors.textDim,
                          textTransform: "uppercase",
                        }}
                      >
                        {p.category}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p
              className="ug-mono"
              style={{
                marginTop: 14,
                fontSize: 9,
                letterSpacing: "0.1em",
                color: colors.textDim,
                textAlign: "center",
              }}
            >
              {rendering
                ? "RENDERING… THIS TAKES 10-30 SECONDS"
                : remaining != null
                  ? `${remaining} PREVIEWS LEFT TODAY · BETA`
                  : "TAP A MOD TO PREVIEW · BETA"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Frame({
  label,
  url,
  loading,
  accent,
}: {
  label: string;
  url: string | null;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "16 / 10",
        borderRadius: 12,
        overflow: "hidden",
        border: accent ? `1.5px solid ${colors.accentBorder}` : `1px solid ${colors.border}`,
        background: colors.bgElevated,
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.textMuted,
            fontSize: 12,
          }}
        >
          {loading ? (
            <span className="ug-mono" style={{ letterSpacing: "0.2em", fontSize: 10 }}>
              RENDERING…
            </span>
          ) : null}
        </div>
      )}
      {loading && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "ugShimmer 1.4s linear infinite",
          }}
        />
      )}
      <span
        className="ug-mono"
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          padding: "3px 8px",
          borderRadius: 4,
          fontSize: 8.5,
          fontWeight: 700,
          letterSpacing: "0.25em",
          background: accent ? colors.accent : "rgba(0,0,0,0.6)",
          color: accent ? "#0a0a0a" : colors.text,
        }}
      >
        {label}
      </span>
    </div>
  );
}
