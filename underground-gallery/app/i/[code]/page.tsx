// app/i/[code]/page.tsx
// Public landing page reached via QR scan or share link.

import { redirect } from "next/navigation";
import InviteSignupForm from "@/components/invites/InviteSignupForm";
import BootIntro from "@/components/invites/BootIntro";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inviteCodes, users } from "@/lib/db/schema";
import { colors, fonts } from "@/lib/design";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export default async function InviteLandingPage({ params }: Params) {
  const { code } = await params;
  const trimmed = (code ?? "").trim();
  if (!trimmed) redirect("/");

  const found = await db
    .select({
      id: inviteCodes.id,
      isActive: inviteCodes.isActive,
      ownerCallsign: users.callsign,
      ownerEmail: users.email,
      code: inviteCodes.code,
    })
    .from(inviteCodes)
    .innerJoin(users, eq(users.id, inviteCodes.ownerUserId))
    .where(sql`LOWER(${inviteCodes.code}) = LOWER(${trimmed})`)
    .limit(1);

  const status =
    found.length === 0 ? "invalid" : !found[0].isActive ? "revoked" : "valid";

  const inviterLabel =
    found.length > 0
      ? (found[0].ownerCallsign ?? found[0].ownerEmail ?? "a member")
      : null;

  const continueHref =
    status === "valid"
      ? `/?code=${encodeURIComponent(found[0].code)}#apply`
      : "/";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        backgroundImage:
          "radial-gradient(ellipse at 50% 30%, rgba(255,42,42,0.10), transparent 55%), radial-gradient(ellipse at 50% 90%, rgba(255,42,42,0.05), transparent 60%)",
        color: colors.text,
        fontFamily: fonts.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="ug-vignette" />
      <div
        className={status === "valid" ? "ug-glass" : "ug-card"}
        style={{ maxWidth: 520, width: "100%", textAlign: "center", padding: 32, position: "relative", zIndex: 1 }}
      >
        <div
          className="ug-mono"
          style={{
            fontSize: 11,
            color: colors.accent,
            fontWeight: 700,
            letterSpacing: "0.4em",
            marginBottom: 16,
          }}
        >
          ∕∕ UNDERGROUND GALLERY
        </div>

        {status === "valid" ? (
          <>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 800,
                margin: "0 0 12px",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              You've got an invite.
            </h1>
            <p
              style={{
                fontSize: 14,
                color: colors.textMuted,
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: colors.accent }}>{inviterLabel}</strong>{" "}
              wants you in the room.
            </p>

            <div
              className="ug-glass-tinted ug-mono"
              style={{
                fontSize: 24,
                letterSpacing: "0.2em",
                padding: "16px 24px",
                marginBottom: 24,
                color: colors.text,
              }}
            >
              {found[0].code}
            </div>

            <InviteSignupForm code={found[0].code} />

            <p
              className="ug-mono"
              style={{
                fontSize: 11,
                color: colors.textDim,
                marginTop: 24,
                lineHeight: 1.6,
                letterSpacing: "0.1em",
              }}
            >
              Applications are reviewed by hand. We'll email you when a decision is made.
            </p>
          </>
        ) : status === "revoked" ? (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              That code's been retired.
            </h1>
            <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
              The member who issued it has rotated their code. Ask them for the fresh one.
            </p>
            <a href="/" className="ug-btn ug-btn-ghost" style={{ textDecoration: "none" }}>
              ← BACK TO THE DOOR
            </a>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              That code doesn't exist.
            </h1>
            <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
              Double-check the spelling or ask whoever sent it for a fresh one.
            </p>
            <a href="/" className="ug-btn ug-btn-ghost" style={{ textDecoration: "none" }}>
              ← BACK TO THE DOOR
            </a>
          </>
        )}
      </div>
    </main>
  );
}
