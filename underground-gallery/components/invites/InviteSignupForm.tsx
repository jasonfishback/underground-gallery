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
      <input
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
        style={{ width: "100%", padding: "16px 20px", background: colors.bg, border: `0.5px solid ${colors.border}`, color: colors.text, fontSize: 18, fontFamily: fonts.sans, marginBottom: 12, boxSizing: "border-box" }}
      />
      <button type="submit" disabled={submitting} style={{ width: "100%", padding: "16px 24px", background: colors.accent, color: "#0a0a0a", border: "none", fontFamily: fonts.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.4em", cursor: "pointer", opacity: submitting ? 0.5 : 1 }}>
        {submitting ? "SENDING..." : "ACCEPT INVITE"}
      </button>
      {msg && (
        <div style={{ marginTop: 12, padding: 12, border: `0.5px solid ${msg.kind === "error" ? colors.danger : colors.success}`, color: msg.kind === "error" ? colors.danger : colors.success, fontSize: 12, fontFamily: fonts.mono }}>
          {msg.text}
        </div>
      )}
    </form>
  );
}