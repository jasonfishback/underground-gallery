"use client";

// components/garage/AddModModal.tsx
// Modal that opens when an owner clicks "+ ADD MOD" on /v/[id].
// Two tabs: catalog picker (27 seeded mods) and custom entry.
//
// Uses existing server actions from app/garage/actions.ts:
//   - addModFromCatalog({ vehicleId, catalogId })
//   - addCustomMod({ vehicleId, name, category, brand, hpDelta, notes })

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addModFromCatalog, addCustomMod } from "@/app/garage/actions";
import { colors, fonts } from "@/lib/design";

type CatalogMod = {
  id: string;
  category: string | null;
  brand: string | null;
  name: string;
  hpDelta: number | null;
  description: string | null;
};

type Props = {
  vehicleId: string;
  open: boolean;
  onClose: () => void;
};

const CATEGORIES = [
  "Tune",
  "Turbo",
  "Intake",
  "Exhaust",
  "Downpipes",
  "Headers",
  "Fuel",
  "Intercooler",
  "Transmission",
  "Tires",
  "Suspension",
  "Brakes",
  "WeightReduction",
  "Aero",
  "Drivetrain",
  "Custom",
];

export default function AddModModal({ vehicleId, open, onClose }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"catalog" | "custom">("catalog");
  const [submitting, startSubmit] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // ---- catalog state ----
  const [catalog, setCatalog] = useState<CatalogMod[] | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);

  // ---- custom state ----
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Intake");
  const [hpDelta, setHpDelta] = useState("");
  const [notes, setNotes] = useState("");

  // Load catalog when modal opens
  useEffect(() => {
    if (!open || catalog !== null) return;
    setCatalogLoading(true);
    fetch("/api/mod-catalog")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => {
        setCatalog(d?.results ?? []);
      })
      .catch(() => {
        // Fallback: empty catalog, custom tab still works
        setCatalog([]);
      })
      .finally(() => setCatalogLoading(false));
  }, [open, catalog]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTab("catalog");
      setErr(null);
      setName("");
      setBrand("");
      setCategory("Intake");
      setHpDelta("");
      setNotes("");
      setCatalogQuery("");
    }
  }, [open]);

  if (!open) return null;

  function handlePickCatalog(modId: string) {
    setErr(null);
    startSubmit(async () => {
      try {
        const res = await addModFromCatalog({
          vehicleId,
          modCatalogId: modId,
        } as any);
        if ((res as any)?.ok === false) {
          setErr((res as any)?.error ?? "Could not add mod.");
          return;
        }
        router.refresh();
        onClose();
      } catch (e) {
        console.error(e);
        setErr("Could not add mod.");
      }
    });
  }

  function handleSubmitCustom() {
    setErr(null);
    if (!name.trim()) {
      setErr("Name is required.");
      return;
    }
    const hp = hpDelta.trim() === "" ? null : parseInt(hpDelta, 10);
    if (hp !== null && Number.isNaN(hp)) {
      setErr("HP gain must be a number.");
      return;
    }
    startSubmit(async () => {
      try {
        const res = await addCustomMod({
          vehicleId,
          customName: name.trim(),
          category,
          hpGain: hp ?? 0,
          notes: notes.trim() || undefined,
        } as any);
        if ((res as any)?.ok === false) {
          setErr((res as any)?.error ?? "Could not add mod.");
          return;
        }
        router.refresh();
        onClose();
      } catch (e) {
        console.error(e);
        setErr("Could not add mod.");
      }
    });
  }

  // Filter catalog by query
  const filteredCatalog = (catalog ?? []).filter((m) => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.name?.toLowerCase().includes(q) ?? false) ||
      (m.brand?.toLowerCase().includes(q) ?? false) ||
      (m.category?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bgElevated,
          border: `0.5px solid ${colors.border}`,
          maxWidth: 640,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          color: colors.text,
          fontFamily: fonts.sans,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `0.5px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.4em",
              color: colors.accent,
              fontFamily: fonts.mono,
              fontWeight: 700,
            }}
          >
            ADD MODIFICATION
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: colors.textMuted,
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `0.5px solid ${colors.border}` }}>
          <TabBtn active={tab === "catalog"} onClick={() => setTab("catalog")}>
            FROM CATALOG
          </TabBtn>
          <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>
            CUSTOM
          </TabBtn>
        </div>

        <div style={{ padding: 20 }}>
          {err && (
            <div
              style={{
                color: colors.danger,
                fontSize: 12,
                marginBottom: 12,
                fontFamily: fonts.mono,
              }}
            >
              {err}
            </div>
          )}

          {tab === "catalog" ? (
            <div>
              <input
                type="text"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="Search exhaust, BMW M3, etc."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: colors.bg,
                  border: `0.5px solid ${colors.border}`,
                  color: colors.text,
                  fontSize: 13,
                  fontFamily: fonts.sans,
                  marginBottom: 12,
                }}
              />

              {catalogLoading ? (
                <p style={{ color: colors.textMuted, fontSize: 12 }}>Loading…</p>
              ) : filteredCatalog.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: colors.textMuted,
                    fontSize: 12,
                    border: `0.5px dashed ${colors.border}`,
                  }}
                >
                  No catalog mods match. Try the <strong>CUSTOM</strong> tab.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 360, overflow: "auto" }}>
                  {filteredCatalog.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handlePickCatalog(m.id)}
                      disabled={submitting}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: 12,
                        padding: "10px 12px",
                        background: "transparent",
                        border: `0.5px solid ${colors.border}`,
                        color: colors.text,
                        textAlign: "left",
                        cursor: submitting ? "wait" : "pointer",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: 9,
                          letterSpacing: "0.3em",
                          color: colors.textMuted,
                          fontWeight: 700,
                          minWidth: 70,
                        }}
                      >
                        {m.category?.toUpperCase() ?? "OTHER"}
                      </span>
                      <span style={{ fontSize: 13 }}>
                        {m.brand ? <strong>{m.brand}</strong> : null} {m.name}
                      </span>
                      <span
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: 11,
                          color: m.hpDelta && m.hpDelta > 0 ? colors.accent : colors.textDim,
                        }}
                      >
                        {m.hpDelta != null ? `${m.hpDelta > 0 ? "+" : ""}${m.hpDelta} hp` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Name *">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Catback exhaust"
                  style={inputStyle}
                />
              </Field>
              <Field label="Brand">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Borla"
                  style={inputStyle}
                />
              </Field>
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="HP gain (optional)">
                <input
                  type="number"
                  value={hpDelta}
                  onChange={(e) => setHpDelta(e.target.value)}
                  placeholder="e.g. 15"
                  style={inputStyle}
                />
              </Field>
              <Field label="Notes (optional)">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Stainless, dyno-tuned"
                  style={inputStyle}
                />
              </Field>

              <button
                onClick={handleSubmitCustom}
                disabled={submitting}
                style={{
                  marginTop: 8,
                  padding: "10px 18px",
                  background: colors.accent,
                  color: "#0a0a0a",
                  border: "none",
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  cursor: submitting ? "wait" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "ADDING…" : "ADD MOD"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#0a0a0a",
  border: "0.5px solid #222",
  color: "#fafafa",
  fontSize: 13,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.3em",
          color: "#888",
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label.toUpperCase()}
      </div>
      {children}
    </label>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px",
        background: active ? "#111" : "transparent",
        border: "none",
        borderBottom: active ? "2px solid #ff3030" : "2px solid transparent",
        color: active ? "#fafafa" : "#888",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.3em",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
