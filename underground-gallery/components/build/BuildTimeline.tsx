"use client";

// components/build/BuildTimeline.tsx
//
// The build log timeline shown on /v/[id] — a dated vertical rail of build
// updates, each with a horizontal photo strip. Owners get a "+ LOG UPDATE"
// composer plus edit/delete on every entry; everyone else reads the story.

import { useState } from "react";
import { useRouter } from "next/navigation";
import BuildEntryComposer, {
  type ComposerInitial,
} from "@/components/build/BuildEntryComposer";
import { deleteBuildEntry } from "@/app/garage/build-actions";
import { colors, fonts } from "@/lib/design";

export type TimelineEntry = {
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
  isOwner: boolean;
  entries: TimelineEntry[];
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

function formatCost(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
  });
}

export default function BuildTimeline({ vehicleId, isOwner, entries }: Props) {
  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<ComposerInitial | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalInvested = entries.reduce((sum, e) => sum + (e.costCents ?? 0), 0);

  function openEdit(e: TimelineEntry) {
    setEditing({
      id: e.id,
      title: e.title,
      category: e.category,
      body: e.body,
      entryDate: e.entryDate,
      costCents: e.costCents,
      photos: e.photos,
    });
    setComposerOpen(true);
  }

  async function handleDelete(entryId: string) {
    if (!confirm("Delete this build update? Its photos stay in the gallery.")) return;
    setDeleting(entryId);
    try {
      const res = await deleteBuildEntry(entryId);
      if (!res.ok) alert(res.error);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section style={{ marginTop: 32 }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
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
            ∕∕ Build Log
          </h2>
          {totalInvested > 0 && (
            <span
              className="ug-mono"
              style={{ fontSize: 10, letterSpacing: "0.14em", color: colors.textDim }}
            >
              {formatCost(totalInvested)} INVESTED
            </span>
          )}
        </div>
        {isOwner && (
          <button
            onClick={() => {
              setEditing(null);
              setComposerOpen(true);
            }}
            className="ug-btn ug-btn-primary"
          >
            + Log update
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        isOwner ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setComposerOpen(true);
            }}
            style={{
              width: "100%",
              padding: "44px 24px",
              background: "rgba(255,42,42,0.04)",
              border: `2px dashed ${colors.accentBorder}`,
              borderRadius: 14,
              color: colors.text,
              cursor: "pointer",
              textAlign: "center",
              fontFamily: fonts.sans,
              transition: "background 140ms ease",
            }}
          >
            <div style={{ fontSize: 30, marginBottom: 10 }}>🔧</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
              Start the build log
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, maxWidth: 420, margin: "0 auto" }}>
              Every mod, fix, and milestone — with photos. Tap to log the first
              update. Takes 30 seconds.
            </div>
          </button>
        ) : (
          <div
            className="ug-card"
            style={{
              borderStyle: "dashed",
              padding: 32,
              textAlign: "center",
              color: colors.textMuted,
              fontSize: 13,
              fontFamily: fonts.mono,
              letterSpacing: "0.12em",
            }}
          >
            No build updates yet.
          </div>
        )
      ) : (
        <div style={{ position: "relative", paddingLeft: 22 }}>
          {/* Vertical rail */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 5,
              top: 8,
              bottom: 8,
              width: 1,
              background:
                "linear-gradient(180deg, rgba(255,42,42,0.55), rgba(255,255,255,0.06))",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {entries.map((e) => (
              <article key={e.id} style={{ position: "relative" }}>
                {/* Node dot */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: -22,
                    top: 14,
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    background: colors.bg,
                    border: `2px solid ${colors.accent}`,
                    boxShadow: "0 0 10px rgba(255,42,42,0.45)",
                  }}
                />

                <div className="ug-card" style={{ padding: 18 }}>
                  {/* Meta row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      className="ug-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.22em",
                        color: colors.accent,
                        fontWeight: 700,
                      }}
                    >
                      {formatDate(e.entryDate)}
                    </span>
                    {e.category && (
                      <span
                        className="ug-mono"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          padding: "4px 9px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.05)",
                          border: `1px solid ${colors.border}`,
                          color: colors.textMuted,
                        }}
                      >
                        {e.category}
                      </span>
                    )}
                    {e.costCents != null && e.costCents > 0 && (
                      <span
                        className="ug-mono"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          padding: "4px 9px",
                          borderRadius: 999,
                          background: colors.accentSoft,
                          border: `1px solid ${colors.accentBorder}`,
                          color: "#ff8a8a",
                        }}
                      >
                        {formatCost(e.costCents)}
                      </span>
                    )}

                    {isOwner && (
                      <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <button
                          onClick={() => openEdit(e)}
                          className="ug-mono"
                          title="Edit entry"
                          style={{
                            padding: "4px 9px",
                            background: "transparent",
                            color: colors.textMuted,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 6,
                            fontSize: 9,
                            letterSpacing: "0.14em",
                            cursor: "pointer",
                          }}
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          disabled={deleting === e.id}
                          className="ug-mono"
                          title="Delete entry"
                          style={{
                            padding: "4px 9px",
                            background: "transparent",
                            color: "#ff8a8a",
                            border: `1px solid ${colors.accentBorder}`,
                            borderRadius: 6,
                            fontSize: 9,
                            cursor: "pointer",
                          }}
                        >
                          🗑
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      margin: "0 0 6px",
                      fontSize: 17,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                      color: colors.text,
                      lineHeight: 1.25,
                    }}
                  >
                    {e.title}
                  </h3>

                  {/* Body */}
                  {e.body && (
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        color: colors.textMuted,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {e.body}
                    </p>
                  )}

                  {/* Photo strip */}
                  {e.photos.length > 0 && (
                    <div
                      className="ug-photo-strip"
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 12,
                        overflowX: "auto",
                        paddingBottom: 4,
                        WebkitOverflowScrolling: "touch",
                      }}
                    >
                      {e.photos.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setLightbox(p.url)}
                          style={{
                            flexShrink: 0,
                            width: e.photos.length === 1 ? "100%" : 168,
                            maxWidth: e.photos.length === 1 ? 420 : 168,
                            aspectRatio: "4 / 3",
                            borderRadius: 10,
                            overflow: "hidden",
                            border: `1px solid ${colors.border}`,
                            padding: 0,
                            cursor: "zoom-in",
                            background: colors.bgElevated,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.url}
                            alt=""
                            loading="lazy"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: 12,
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
            }}
          />
        </div>
      )}

      {isOwner && (
        <BuildEntryComposer
          vehicleId={vehicleId}
          open={composerOpen}
          initial={editing}
          onClose={() => {
            setComposerOpen(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}
