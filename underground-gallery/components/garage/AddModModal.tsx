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
  existingCatalogIds?: string[];
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

export default function AddModModal({ vehicleId, open, onClose, existingCatalogIds = [] }: Props) {
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
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
        setJustAddedId(modId);
        router.refresh();
        // Modal stays open so user can add more or see feedback. Auto-close after 1.5s.
        setTimeout(() => {
          setJustAddedId(null);
          onClose();
        }, 1200);
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
    <div className="ug-modal-backdrop" onClick={onClose}>
      <div
        className="ug-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, padding: 0, overflow: "hidden" }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            className="ug-mono"
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.4em",
              color: colors.accent,
              fontWeight: 700,
            }}
          >
            // ADD MODIFICATION
          </h2>
          <button
            onClick={onClose}
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

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}` }}>
          <TabBtn active={tab === "catalog"} onClick={() => setTab("catalog")}>
            FROM CATALOG
          </TabBtn>
          <TabBtn active={tab === "custom"} onClick={() => setTab("custom")}>
            CUSTOM
          </TabBtn>
        </div>

        <div style={{ padding: 20, maxHeight: "70vh", overflowY: "auto" }}>
          {err && (
            <div className="ug-banner ug-banner-error" style={{ marginBottom: 12 }}>
              {err}
            </div>
          )}

          {tab === "catalog" ? (
            <div>
              <label className="ug-label" htmlFor="modCatalogSearch">
                Search catalog
              </label>
              <input
                id="modCatalogSearch"
                type="text"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="Search exhaust, BMW M3, etc."
                className="ug-input"
                style={{ marginBottom: 12 }}
              />

              {catalogLoading ? (
                <p style={{ color: colors.textMuted, fontSize: 12 }}>Loading…</p>
              ) : filteredCatalog.length === 0 ? (
                <div
                  className="ug-card"
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: colors.textMuted,
                    fontSize: 12,
                    borderStyle: "dashed",
                  }}
                >
                  No catalog mods match. Try the <strong>CUSTOM</strong> tab.
                </div>
              ) : (
                <ul
                  className="ug-list"
                  style={{ maxHeight: 360, overflow: "auto" }}
                >
                  {filteredCatalog.map((m) => {
                    const alreadyAdded = existingCatalogIds.includes(m.id);
                    const justAdded = justAddedId === m.id;
                    const disabled = submitting || alreadyAdded || justAdded;
                    return (
                      <li key={m.id}>
                        <button
                          onClick={() => handlePickCatalog(m.id)}
                          disabled={disabled}
                          className="ug-list-row"
                          style={{
                            background: justAdded
                              ? "rgba(120,220,150,0.10)"
                              : undefined,
                            opacity: alreadyAdded ? 0.5 : 1,
                            cursor: disabled ? "not-allowed" : "pointer",
                            display: "grid",
                            gridTemplateColumns: "auto 1fr auto",
                            gap: 12,
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
                              minWidth: 70,
                            }}
                          >
                            {m.category?.toUpperCase() ?? "OTHER"}
                          </span>
                          <span style={{ fontSize: 13 }}>
                            {m.brand ? <strong>{m.brand}</strong> : null} {m.name}
                          </span>
                          <span
                            className="ug-list-meta"
                            style={{
                              color: justAdded
                                ? colors.success
                                : alreadyAdded
                                  ? colors.textDim
                                  : m.hpDelta && m.hpDelta > 0
                                    ? colors.accent
                                    : colors.textDim,
                              fontWeight: justAdded || alreadyAdded ? 700 : 400,
                              letterSpacing:
                                justAdded || alreadyAdded ? "0.2em" : "0",
                            }}
                          >
                            {justAdded
                              ? "+ ADDED"
                              : alreadyAdded
                                ? "ALREADY ADDED"
                                : m.hpDelta != null
                                  ? `${m.hpDelta > 0 ? "+" : ""}${m.hpDelta} hp`
                                  : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Name *" htmlFor="customModName">
                <input
                  id="customModName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Catback exhaust"
                  className="ug-input"
                />
              </Field>
              <Field label="Brand" htmlFor="customModBrand">
                <input
                  id="customModBrand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Borla"
                  className="ug-input"
                />
              </Field>
              <Field label="Category" htmlFor="customModCategory">
                <select
                  id="customModCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ug-input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="HP gain (optional)" htmlFor="customModHp">
                <input
                  id="customModHp"
                  type="number"
                  value={hpDelta}
                  onChange={(e) => setHpDelta(e.target.value)}
                  placeholder="e.g. 15"
                  className="ug-input"
                />
              </Field>
              <Field label="Notes (optional)" htmlFor="customModNotes">
                <input
                  id="customModNotes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Stainless, dyno-tuned"
                  className="ug-input"
                />
              </Field>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "row-reverse",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleSubmitCustom}
                  disabled={submitting}
                  className="ug-btn ug-btn-primary"
                  style={{ flex: 1, minWidth: 200 }}
                >
                  {submitting ? "Adding…" : "Add mod →"}
                </button>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="ug-btn ug-btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="ug-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
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
      className="ug-mono"
      style={{
        flex: 1,
        padding: "12px",
        background: active ? "rgba(255,255,255,0.04)" : "transparent",
        border: "none",
        borderBottom: active
          ? `2px solid ${colors.accent}`
          : "2px solid transparent",
        color: active ? colors.text : colors.textMuted,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.3em",
        cursor: "pointer",
        fontFamily: fonts.mono,
      }}
    >
      {children}
    </button>
  );
}
