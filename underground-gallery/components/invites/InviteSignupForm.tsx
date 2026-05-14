"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { colors, fonts } from "@/lib/design";
export default function InviteSignupForm({ code }: { code: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg({ kind: "error", text: "Valid email required." });
      return;
    }
    setSubmitting(true);
    try {
      const cleaned = email.trim().toLowerCase();
      try { document.cookie = `ug_invite=${encodeURIComponent(code)}; path=/; max-age=2592000; SameSite=Lax`; } catch {}
      await signIn("resend", { email: cleaned, redirectTo: `/pending?invite=${encodeURIComponent(code)}` });
    } catch {
      setMsg({ kind: "error", text: "Could not send link. Try again." });
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={handle} style={{ width: "100%", maxWidth: 380, margin: "0 auto" }}>
      <label className="ug-label" htmlFor="invite-email" style={{ textAlign: "left" }}>Email</label>
      <input
        id="invite-email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        disabled={submitting}
        className="ug-input ug-input-lg"
        style={{ marginBottom: 12 }}
      />
      <button
        type="submit"
        disabled={submitting}
        className="ug-btn ug-btn-primary ug-btn-block"
      >
        {submitting ? "SENDING..." : "ACCEPT INVITE →"}
      </button>
      {msg && (
        <div
          className={`ug-banner ${msg.kind === "error" ? "ug-banner-error" : "ug-banner-success"}`}
          style={{ marginTop: 12, fontFamily: fonts.mono }}
        >
          {msg.text}
        </div>
      )}
    </form>
  );
}
