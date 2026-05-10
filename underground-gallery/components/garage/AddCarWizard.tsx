"use client";

// ============================================================================
// components/garage/AddCarWizard.tsx
//
// Flow:
//   step "search"  -> typeahead. Picks a SpecSearchResult (catalog) OR
//                     NhtsaResult (no spec id, just Y/M/M). Or "add manually".
//   step "confirm" -> show the picked vehicle, optional name, ADD button.
//   step "manual"  -> manual Y/M/M/T form + optional name.
//   submit         -> calls addCarFromSpec | addCarFromManual.
//
// 2026-05-09 fixes (in order):
//   1. Wizard sent flat payload; addCarFromManualSchema requires
//      { manualSpecs: {...} }. Wrapped properly + default trim to ''.
//   2. Re-added "Name this car" input now that drizzle/0009 added a
//      `vehicles.name` column. Optional, max 40 chars.
//   3. Always query both catalog AND NHTSA, dedupe by Y/M/M, so users
//      typing "2017 ford" see F-150/F-350/Mustang/etc., not just the
//      Focus RS that's the only Ford in the curated 42-car catalog.
//   4. Restyled with iOS-frosted-glass design tokens from globals.css
//      (.ug-modal, .ug-input, .ug-btn-primary, .ug-list, etc.).
// ============================================================================

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  searchVehicleSpecs,
  addCarFromSpec,
  addCarFromManual,
  type SpecSearchResult,
} from "@/app/garage/actions";

type NhtsaResult = {
  source: "nhtsa";
  year: number;
  make: string;
  model: string;
  label: string;
};

type SearchHit =
  | (SpecSearchResult & { kind: "catalog" })
  | (NhtsaResult & { kind: "nhtsa"; id?: undefined; trim?: null });

type Picked =
  | { kind: "catalog"; specId: string; label: string; year: number; make: string; model: string }
  | { kind: "nhtsa"; label: string; year: number; make: string; model: string }
  | { kind: "manual" };

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AddCarWizard({ open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"search" | "confirm" | "manual">("search");
  const [picked, setPicked] = useState<Picked | null>(null);

  // search state
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchedAt, setSearchedAt] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // optional nickname (used by both confirm and manual paths)
  const [carName, setCarName] = useState("");

  // manual state
  const [mYear, setMYear] = useState("");
  const [mMake, setMMake] = useState("");
  const [mModel, setMModel] = useState("");
  const [mTrim, setMTrim] = useState("");

  // submit state
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  // reset on close
  useEffect(() => {
    if (!open) {
      setStep("search");
      setPicked(null);
      setQuery("");
      setHits([]);
      setCarName("");
      setMYear("");
      setMMake("");
      setMModel("");
      setMTrim("");
      setSubmitErr(null);
    }
  }, [open]);

  // debounced search: catalog AND NHTSA in parallel, dedupe by Y/M/M
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const myStamp = Date.now();
      try {
        const [catalog, nhtsaRes] = await Promise.all([
          searchVehicleSpecs(q),
          fetch(`/api/vehicle-data/search?q=${encodeURIComponent(q)}`)
            .then(async (res) =>
              res.ok
                ? ((await res.json()) as { ok: boolean; results: NhtsaResult[] })
                : { ok: false as const, results: [] as NhtsaResult[] },
            )
            .catch(() => ({ ok: false as const, results: [] as NhtsaResult[] })),
        ]);

        const catalogHits: SearchHit[] =
          catalog.ok && catalog.results.length > 0
            ? catalog.results.map((r) => ({ ...r, kind: "catalog" as const }))
            : [];

        const seen = new Set(
          catalogHits.map(
            (h) => `${h.year}|${h.make.toLowerCase()}|${h.model.toLowerCase()}`,
          ),
        );
        const nhtsaHits: SearchHit[] = (nhtsaRes.results ?? [])
          .filter(
            (n) =>
              !seen.has(
                `${n.year}|${n.make.toLowerCase()}|${n.model.toLowerCase()}`,
              ),
          )
          .map((r) => ({ ...r, kind: "nhtsa" as const }));

        const merged: SearchHit[] = [...catalogHits, ...nhtsaHits];

        if (myStamp >= searchedAt) {
          setHits(merged);
          setSearchedAt(myStamp);
        }
      } catch (err) {
        console.error("[AddCarWizard] search failed", err);
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (!open) return null;

  function handlePick(hit: SearchHit) {
    if (hit.kind === "catalog") {
      setPicked({
        kind: "catalog",
        specId: hit.id,
        label: hit.label,
        year: hit.year,
        make: hit.make,
        model: hit.model,
      });
    } else {
      setPicked({
        kind: "nhtsa",
        label: hit.label,
        year: hit.year,
        make: hit.make,
        model: hit.model,
      });
    }
    setSubmitErr(null);
    setStep("confirm");
  }

  function handleManual() {
    setPicked({ kind: "manual" });
    setSubmitErr(null);
    setStep("manual");
  }

  function handleSubmit() {
    setSubmitErr(null);
    startSubmit(async () => {
      try {
        const cleanName = carName.trim();
        let res: { ok: boolean; error?: string } | undefined;

        if (picked?.kind === "catalog") {
          res = (await addCarFromSpec({
            vehicleSpecId: picked.specId,
            name: cleanName || undefined,
          })) as { ok: boolean; error?: string };
        } else if (picked?.kind === "nhtsa") {
          res = (await addCarFromManual({
            manualSpecs: {
              year: picked.year,
              make: picked.make,
              model: picked.model,
              trim: "",
            },
            name: cleanName || undefined,
          })) as { ok: boolean; error?: string };
        } else if (picked?.kind === "manual") {
          const yearNum = parseInt(mYear, 10);
          if (!yearNum || yearNum < 1900 || yearNum > 2100) {
            setSubmitErr("Enter a valid year.");
            return;
          }
          if (!mMake.trim() || !mModel.trim()) {
            setSubmitErr("Make and model required.");
            return;
          }
          res = (await addCarFromManual({
            manualSpecs: {
              year: yearNum,
              make: mMake.trim(),
              model: mModel.trim(),
              trim: mTrim.trim(),
            },
            name: cleanName || undefined,
          })) as { ok: boolean; error?: string };
        } else {
          setSubmitErr("Pick a vehicle first.");
          return;
        }

        if (!res?.ok) {
          setSubmitErr(res?.error ?? "Could not add car.");
          return;
        }

        onClose();
        router.refresh();
      } catch (err) {
        console.error("[AddCarWizard] submit failed", err);
        setSubmitErr(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    });
  }

  // ---------- render ----------
  return (
    <div className="ug-modal-backdrop" onClick={onClose}>
      <div className="ug-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "0.04em" }}>
            ADD VEHICLE
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--ug-border)",
              borderRadius: 999,
              width: 32,
              height: 32,
              color: "var(--ug-fg-dim)",
              fontSize: 16,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {step === "search" && (
          <div>
            <label className="ug-label">Search your vehicle</label>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 2017 Ford F-350, 2015 BMW M3, Mustang GT…"
              className="ug-input ug-input-lg"
            />

            <div style={{ marginTop: 16, minHeight: 200 }}>
              {query.trim().length < 2 ? (
                <p style={{ fontSize: 13, color: "var(--ug-fg-muted)", margin: 0 }}>
                  Type a year, make, and model. We search a curated catalog plus
                  NHTSA's full database — every U.S. car ever sold.
                </p>
              ) : searching ? (
                <p style={{ fontSize: 13, color: "var(--ug-fg-muted)", margin: 0 }}>
                  Searching…
                </p>
              ) : hits.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--ug-fg-muted)", margin: 0 }}>
                  No matches. You can{" "}
                  <button
                    onClick={handleManual}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ug-accent)",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 13,
                    }}
                  >
                    enter it manually
                  </button>
                  .
                </p>
              ) : (
                <ul className="ug-list" style={{ maxHeight: "50vh", overflowY: "auto" }}>
                  {hits.map((hit, i) => (
                    <li key={`${hit.kind}-${i}-${hit.label}`}>
                      <button onClick={() => handlePick(hit)} className="ug-list-row">
                        <span>{hit.label}</span>
                        <span className="ug-list-meta">
                          {hit.kind === "catalog"
                            ? `catalog${hit.hpStock ? ` · ${hit.hpStock} hp` : ""}`
                            : "nhtsa"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <button onClick={handleManual} className="ug-btn ug-btn-text">
                Add manually instead
              </button>
              <button onClick={onClose} className="ug-btn ug-btn-text">
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && picked && picked.kind !== "manual" && (
          <div>
            <p className="ug-label" style={{ marginBottom: 4 }}>You picked</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 24px" }}>{picked.label}</p>

            <label className="ug-label">Name this car (optional)</label>
            <input
              type="text"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="e.g. Daily, Track Rat, Project E36"
              maxLength={40}
              className="ug-input ug-input-lg"
            />

            {submitErr && (
              <div className="ug-banner ug-banner-error" style={{ marginTop: 16 }}>
                {submitErr}
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", flexDirection: "row-reverse", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="ug-btn ug-btn-primary ug-btn-block"
                style={{ flex: 1, minWidth: 200 }}
              >
                {submitting ? "Adding…" : "Add to garage →"}
              </button>
              <button
                onClick={() => setStep("search")}
                disabled={submitting}
                className="ug-btn ug-btn-text"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {step === "manual" && (
          <div>
            <p style={{ fontSize: 14, color: "var(--ug-fg-dim)", margin: "0 0 20px" }}>
              Enter your vehicle details. You can refine HP, weight, and drivetrain
              later in the spec sheet.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <Field label="Year">
                <input
                  type="number"
                  value={mYear}
                  onChange={(e) => setMYear(e.target.value)}
                  placeholder="2015"
                  min={1900}
                  max={2100}
                  className="ug-input"
                />
              </Field>
              <Field label="Make">
                <input
                  type="text"
                  value={mMake}
                  onChange={(e) => setMMake(e.target.value)}
                  placeholder="BMW"
                  className="ug-input"
                />
              </Field>
              <Field label="Model">
                <input
                  type="text"
                  value={mModel}
                  onChange={(e) => setMModel(e.target.value)}
                  placeholder="M3"
                  className="ug-input"
                />
              </Field>
              <Field label="Trim (optional)">
                <input
                  type="text"
                  value={mTrim}
                  onChange={(e) => setMTrim(e.target.value)}
                  placeholder="Competition"
                  className="ug-input"
                />
              </Field>
            </div>

            <div style={{ marginTop: 16 }}>
              <Field label="Name this car (optional)">
                <input
                  type="text"
                  value={carName}
                  onChange={(e) => setCarName(e.target.value)}
                  placeholder="e.g. Daily, Track Rat"
                  maxLength={40}
                  className="ug-input"
                />
              </Field>
            </div>

            {submitErr && (
              <div className="ug-banner ug-banner-error" style={{ marginTop: 16 }}>
                {submitErr}
              </div>
            )}

            <div style={{ marginTop: 24, display: "flex", flexDirection: "row-reverse", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="ug-btn ug-btn-primary ug-btn-block"
                style={{ flex: 1, minWidth: 200 }}
              >
                {submitting ? "Adding…" : "Add to garage →"}
              </button>
              <button
                onClick={() => setStep("search")}
                disabled={submitting}
                className="ug-btn ug-btn-text"
              >
                ← Back to search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span className="ug-label">{label}</span>
      {children}
    </label>
  );
}
