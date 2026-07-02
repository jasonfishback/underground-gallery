"use client";

// components/profile/ProfileEditor.tsx
// Inline bio editor for /profile — wires up the previously-orphaned
// updateProfile server action (bio only; region editing comes later).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/me/actions";
import { colors } from "@/lib/design";

type Props = {
  initialBio: string;
};

export default function ProfileEditor({ initialBio }: Props) {
  const router = useRouter();
  const [bio, setBio] = useState(initialBio);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const dirty = bio.trim() !== initialBio.trim();

  function handleSave() {
    setError(null);
    startSave(async () => {
      const res = await updateProfile({ bio: bio.trim() });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      router.refresh();
    });
  }

  return (
    <div>
      <label className="ug-label">Bio — what do you build, what do you drive?</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="e.g. E36 track build, weekend drag racer, LS-swap everything…"
        rows={4}
        maxLength={500}
        className="ug-input"
        style={{ resize: "vertical", minHeight: 90 }}
      />
      {error && (
        <div className="ug-banner ug-banner-error" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
          gap: 12,
        }}
      >
        <span
          className="ug-mono"
          style={{ fontSize: 10, letterSpacing: "0.14em", color: colors.textDim }}
        >
          {bio.length}/500
        </span>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="ug-btn ug-btn-primary"
          style={{ padding: "10px 20px", fontSize: 11 }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save bio"}
        </button>
      </div>
    </div>
  );
}
