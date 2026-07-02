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
  addCarFromYmm,
  type SpecSearchResult,
} from "@/app/garage/actions";
import { uploadVehiclePhotos } from "@/lib/client/photo-upload";
import { colors, fonts } from "@/lib/design";

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
  const [step, setStep] = useState<"search" | "confirm" | "manual" | "photos">("search");
  const [picked, setPicked] = useState<Picked | null>(null);

  // photo step state (after the car is created)
  const [newVehicleId, setNewVehicleId] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [photoProgress, setPhotoProgress] = useState<{ done: number; total: number } | null>(null);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

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
      setNewVehicleId(null);
      setUploadedUrls([]);
      setPhotoProgress(null);
      setPhotoErr(null);
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
        type AddCarResult = {
          ok: boolean;
          error?: string;
          data?: { vehicleId: string };
        };
        let res: AddCarResult | undefined;

        if (picked?.kind === "catalog") {
          res = (await addCarFromSpec({
            vehicleSpecId: picked.specId,
            name: cleanName || undefined,
          })) as AddCarResult;
        } else if (picked?.kind === "nhtsa") {
          // NHTSA gives Y/M/M only — addCarFromYmm looks up specs via the
          // LLM provider (and caches them) before creating the vehicle.
          res = (await addCarFromYmm({
            year: picked.year,
            make: picked.make,
            model: picked.model,
            name: cleanName || undefined,
          })) as AddCarResult;
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
          })) as AddCarResult;
        } else {
          setSubmitErr("Pick a vehicle first.");
          return;
        }

        if (!res?.ok) {
          setSubmitErr(res?.error ?? "Could not add car.");
          return;
        }

        // Car created — go straight to the photo step so the garage card
        // is never an empty gray tile.
        if (res.data?.vehicleId) {
          setNewVehicleId(res.data.vehicleId);
          setStep("photos");
          router.refresh();
        } else {
          onClose();
          router.refresh();
        }
      } catch (err) {
        console.error("[AddCarWizard] submit failed", err);
        setSubmitErr(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    });
  }

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || !newVehicleId) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setPhotoErr(null);
    setPhotoProgress({ done: 0, total: arr.length });
    const { photos: done, firstError } = await uploadVehiclePhotos(
      arr,
      newVehicleId,
      { onProgress: (d, t) => setPhotoProgress({ done: d, total: t }) },
    );
    setUploadedUrls((prev) => [...prev, ...done.map((p) => p.url)]);
    if (firstError) setPhotoErr(firstError);
    setPhotoProgress(null);
  }

  function finishToVehicle() {
    const id = newVehicleId;
    onClose();
    router.refresh();
    if (id) router.push(`/v/${id}`);
  }

  // ---------- render ----------
  return (
    <div className="ug-modal-backdrop" onClick={onClose}>
      <div className="ug-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "0.04em" }}>
            // ADD VEHICLE
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
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                  Type a year, make, and model. We search a curated catalog plus
                  NHTSA's full database — every U.S. car ever sold.
                </p>
              ) : searching ? (
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                  Searching…
                </p>
              ) : hits.length === 0 ? (
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                  No matches. You can{" "}
                  <button
                    onClick={handleManual}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: colors.accent,
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
            <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px" }}>{picked.label}</p>
            {picked.kind === "nhtsa" && (
              <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 24px", letterSpacing: "0.04em" }}>
                ∕∕ Stock HP, torque, weight and drivetrain will be auto-filled
                when you add it. May take a moment.
              </p>
            )}
            {picked.kind === "catalog" && (
              <div style={{ marginBottom: 24 }} />
            )}

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
                {submitting
                  ? picked?.kind === "nhtsa"
                    ? "Looking up specs…"
                    : "Adding…"
                  : "Add to garage →"}
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
            <p style={{ fontSize: 14, color: colors.textMuted, margin: "0 0 20px" }}>
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

        {step === "photos" && (
          <div>
            <div
              className="ug-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.35em",
                color: colors.accent,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              ∕∕ IT&apos;S IN THE GARAGE
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
              Now give it a face.
            </p>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 20px", lineHeight: 1.55 }}>
              Cars with photos get raced, followed, and talked about. The first
              shot becomes your hero image — you can change it any time.
            </p>

            <input
              ref={libraryRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                handlePhotoFiles(e.target.files);
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
                handlePhotoFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {/* Uploaded previews + add tiles */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
                gap: 8,
                marginBottom: 18,
              }}
            >
              {uploadedUrls.map((url, i) => (
                <div
                  key={url}
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    borderRadius: 10,
                    overflow: "hidden",
                    border: i === 0 ? `1.5px solid ${colors.accent}` : `1px solid ${colors.border}`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {i === 0 && (
                    <span
                      className="ug-mono"
                      style={{
                        position: "absolute",
                        top: 5,
                        left: 5,
                        background: colors.accent,
                        color: "#0a0a0a",
                        padding: "2px 7px",
                        borderRadius: 4,
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.25em",
                      }}
                    >
                      ★ HERO
                    </span>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={!!photoProgress}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  border: `1px dashed ${colors.accentBorder}`,
                  background: colors.accentSoft,
                  color: colors.accent,
                  fontFamily: fonts.mono,
                }}
              >
                <span style={{ fontSize: 24, lineHeight: 1 }}>📸</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em" }}>
                  CAMERA
                </span>
              </button>
              <button
                type="button"
                onClick={() => libraryRef.current?.click()}
                disabled={!!photoProgress}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  border: "1px dashed rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.03)",
                  color: colors.textMuted,
                  fontFamily: fonts.mono,
                }}
              >
                <span style={{ fontSize: 24, lineHeight: 1 }}>🖼️</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em" }}>
                  LIBRARY
                </span>
              </button>
            </div>

            {photoErr && (
              <div className="ug-banner ug-banner-error" style={{ marginBottom: 14 }}>
                {photoErr}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "row-reverse", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <button
                onClick={finishToVehicle}
                disabled={!!photoProgress}
                className="ug-btn ug-btn-primary ug-btn-block"
                style={{ flex: 1, minWidth: 200 }}
              >
                {photoProgress
                  ? `UPLOADING ${photoProgress.done} / ${photoProgress.total}…`
                  : uploadedUrls.length > 0
                    ? "Done — view my build →"
                    : "View my build →"}
              </button>
              {uploadedUrls.length === 0 && (
                <button
                  onClick={finishToVehicle}
                  disabled={!!photoProgress}
                  className="ug-btn ug-btn-text"
                >
                  Skip for now
                </button>
              )}
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
