"use client";

// ============================================================================
// components/garage/AddCarWizard.tsx
//
// Flow:
//   step "search"  -> typeahead. Picks a SpecSearchResult (catalog) OR
//                     NhtsaResult (no spec id, just Y/M/M). Or "add manually".
//   step "confirm" -> show the picked vehicle and an ADD TO GARAGE button.
//   step "manual"  -> manual Y/M/M/T form.
//   submit         -> calls addCarFromSpec | addCarFromManual.
//
// 2026-05-09 fix: previous version sent a flat payload to addCarFromManual
// (e.g. { year, make, model, trim, name }) and a `name` field that never
// existed in the DB schema. addCarFromManualSchema actually expects
// { manualSpecs: { year, make, model, trim, ... } }. Every NHTSA-fallback
// and every manual-add was failing Zod validation silently — that's the
// "people had a hard time adding their vehicle" bug. We now build the
// correctly-shaped payload, default trim to '', and surface Zod errors.
// The "Name this car" input is removed for now (no schema column for it);
// re-add later as a proper `vehicles.name` migration.
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
  const [searchedAt, setSearchedAt] = useState(0); // timestamp of last completed search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setMYear("");
      setMMake("");
      setMModel("");
      setMTrim("");
      setSubmitErr(null);
    }
  }, [open]);

  // debounced search: catalog first, then NHTSA fallback if zero hits
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
        const catalog = await searchVehicleSpecs(q);
        let merged: SearchHit[] = [];
        if (catalog.ok && catalog.results.length > 0) {
          merged = catalog.results.map((r) => ({ ...r, kind: "catalog" as const }));
        } else {
          // NHTSA fallback
          const res = await fetch(`/api/vehicle-data/search?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = (await res.json()) as { ok: boolean; results: NhtsaResult[] };
            merged = (data.results ?? []).map((r) => ({ ...r, kind: "nhtsa" as const }));
          }
        }
        // race guard: only apply if newest
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
        let res: { ok: boolean; error?: string } | undefined;

        if (picked?.kind === "catalog") {
          res = (await addCarFromSpec({
            vehicleSpecId: picked.specId,
          })) as { ok: boolean; error?: string };
        } else if (picked?.kind === "nhtsa") {
          // NHTSA gives us Y/M/M only (no trim) — go through the manual path
          // with the correctly-shaped payload.
          res = (await addCarFromManual({
            manualSpecs: {
              year: picked.year,
              make: picked.make,
              model: picked.model,
              trim: "",
            },
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
              trim: mTrim.trim(), // empty string OK; schema defaults to ''
            },
          })) as { ok: boolean; error?: string };
        } else {
          setSubmitErr("Pick a vehicle first.");
          return;
        }

        if (!res?.ok) {
          setSubmitErr(res?.error ?? "Could not add car.");
          return;
        }

        // success
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
    <div
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/80 p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl sm:rounded-lg border-0 sm:border sm:border-neutral-800 bg-neutral-950 p-5 sm:p-6 text-neutral-100 shadow-2xl min-h-screen sm:min-h-0 sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-wide">ADD VEHICLE</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-200"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {step === "search" && (
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-neutral-400">
              Search your vehicle
            </label>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 2015 bmw m3"
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-5 py-4 text-lg text-neutral-100 placeholder-neutral-500 outline-none focus:border-red-500"
            />

            <div className="mt-4 min-h-[200px]">
              {query.trim().length < 2 ? (
                <p className="text-sm text-neutral-500">
                  Type a year, make, and model. The 42-car catalog is searched first, then
                  NHTSA's full database.
                </p>
              ) : searching ? (
                <p className="text-sm text-neutral-500">Searching...</p>
              ) : hits.length === 0 ? (
                <div>
                  <p className="text-sm text-neutral-500">
                    No matches. You can{" "}
                    <button
                      onClick={handleManual}
                      className="text-red-500 underline hover:text-red-400"
                    >
                      enter it manually
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <ul className="max-h-[50vh] overflow-y-auto divide-y divide-neutral-800 rounded border border-neutral-800">
                  {hits.map((hit, i) => (
                    <li key={`${hit.kind}-${i}-${hit.label}`}>
                      <button
                        onClick={() => handlePick(hit)}
                        className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left hover:bg-neutral-900 active:bg-neutral-800"
                      >
                        <span className="text-neutral-100">{hit.label}</span>
                        <span className="text-xs uppercase tracking-wider text-neutral-500">
                          {hit.kind === "catalog"
                            ? `catalog${hit.hpStock ? ` * ${hit.hpStock}hp` : ""}`
                            : "nhtsa"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex justify-between text-sm">
              <button
                onClick={handleManual}
                className="text-neutral-400 hover:text-neutral-200"
              >
                Add manually instead
              </button>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && picked && picked.kind !== "manual" && (
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-neutral-400">
              You picked
            </p>
            <p className="mb-2 text-lg font-semibold">{picked.label}</p>
            <p className="mb-6 text-sm text-neutral-500">
              You can add mods, photos, and tune HP/weight after the car is in
              your garage.
            </p>

            {submitErr && (
              <p className="mb-3 rounded border border-red-900 bg-red-950/50 p-3 text-sm text-red-400">
                {submitErr}
              </p>
            )}

            <div className="mt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                onClick={() => setStep("search")}
                disabled={submitting}
                className="text-sm text-neutral-400 hover:text-neutral-200"
              >
                {"<- Back"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto rounded bg-red-600 px-6 py-4 text-lg font-semibold tracking-wide text-white hover:bg-red-500 disabled:opacity-50"
              >
                {submitting ? "Adding..." : "ADD TO GARAGE"}
              </button>
            </div>
          </div>
        )}

        {step === "manual" && (
          <div>
            <p className="mb-4 text-sm text-neutral-400">
              Enter your vehicle details. You can refine HP, weight, and drivetrain later
              in the spec sheet.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Year">
                <input
                  type="number"
                  value={mYear}
                  onChange={(e) => setMYear(e.target.value)}
                  placeholder="2015"
                  min={1900}
                  max={2100}
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-5 py-4 text-lg text-neutral-100 outline-none focus:border-red-500"
                />
              </Field>
              <Field label="Make">
                <input
                  type="text"
                  value={mMake}
                  onChange={(e) => setMMake(e.target.value)}
                  placeholder="BMW"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-5 py-4 text-lg text-neutral-100 outline-none focus:border-red-500"
                />
              </Field>
              <Field label="Model">
                <input
                  type="text"
                  value={mModel}
                  onChange={(e) => setMModel(e.target.value)}
                  placeholder="M3"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-5 py-4 text-lg text-neutral-100 outline-none focus:border-red-500"
                />
              </Field>
              <Field label="Trim (optional)">
                <input
                  type="text"
                  value={mTrim}
                  onChange={(e) => setMTrim(e.target.value)}
                  placeholder="Competition"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-5 py-4 text-lg text-neutral-100 outline-none focus:border-red-500"
                />
              </Field>
            </div>

            {submitErr && (
              <p className="mt-3 rounded border border-red-900 bg-red-950/50 p-3 text-sm text-red-400">
                {submitErr}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                onClick={() => setStep("search")}
                disabled={submitting}
                className="text-sm text-neutral-400 hover:text-neutral-200"
              >
                {"<- Back to search"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto rounded bg-red-600 px-6 py-4 text-lg font-semibold tracking-wide text-white hover:bg-red-500 disabled:opacity-50"
              >
                {submitting ? "Adding..." : "ADD TO GARAGE"}
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
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      {children}
    </label>
  );
}
