// app/invites/page.tsx
// Member-facing invites page.

import { redirect } from "next/navigation";
import { eq, and, sql, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, inviteCodes, applications } from "@/lib/db/schema";
import { colors, fonts } from "@/lib/design";
import { ensureMyCode, regenerateMyCode } from "./actions";
import InviteCodeShareCard from "@/components/invites/InviteCodeShareCard";

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?next=/invites");

  const me = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, callsign: true, status: true },
  });

  if (!me) redirect("/auth/signin");
  if (me.status !== "active") redirect("/pending");

  await ensureMyCode();

  const codes = await db
    .select({
      id: inviteCodes.id,
      code: inviteCodes.code,
      isActive: inviteCodes.isActive,
      createdAt: inviteCodes.createdAt,
    })
    .from(inviteCodes)
    .where(eq(inviteCodes.ownerUserId, me.id))
    .orderBy(desc(inviteCodes.createdAt))
    .limit(20);

  const activeCode = codes.find((c) => c.isActive);

  const [{ pendingCount }] = await db
    .select({ pendingCount: sql<number>`count(*)::int` })
    .from(applications)
    .where(and(eq(applications.invitedBy, me.id), eq(applications.status, "pending")));

  const [{ approvedCount }] = await db
    .select({ approvedCount: sql<number>`count(*)::int` })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.userId))
    .where(and(eq(applications.invitedBy, me.id), eq(users.status, "active")));

  const recentReferrals = await db
    .select({
      callsign: users.callsign,
      email: users.email,
      status: users.status,
      submittedAt: applications.submittedAt,
    })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.userId))
    .where(eq(applications.invitedBy, me.id))
    .orderBy(desc(applications.submittedAt))
    .limit(10);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://undergroundgallery.ai";
  const shareLink = activeCode ? `${appUrl}/i/${activeCode.code}` : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.4em",
            color: colors.accent,
            marginBottom: 8,
          }}
        >
          INVITES
        </div>
        <h1 style={{ fontSize: 32, margin: "0 0 8px", letterSpacing: "0.05em" }}>
          Your Code.
        </h1>
        <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 32, maxWidth: 600 }}>
          Anyone who applies with your code is tied to you forever. Build the room you want to be in.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <Stat label="APPROVED" value={approvedCount} highlight />
          <Stat label="PENDING" value={pendingCount} />
        </div>

        {activeCode && shareLink ? (
          <InviteCodeShareCard
            code={activeCode.code}
            shareLink={shareLink}
            createdAt={activeCode.createdAt.toISOString()}
          />
        ) : (
          <div
            style={{
              background: colors.bgElevated,
              border: `0.5px solid ${colors.border}`,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p style={{ color: colors.textMuted, marginBottom: 16 }}>
              No active code. Generate one below.
            </p>
            <form action={regenerateMyCode}>
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  background: colors.accent,
                  color: "#0a0a0a",
                  border: "none",
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  cursor: "pointer",
                }}
              >
                GENERATE CODE
              </button>
            </form>
          </div>
        )}

        <h2
          style={{
            fontSize: 11,
            letterSpacing: "0.4em",
            color: colors.textMuted,
            fontFamily: fonts.mono,
            fontWeight: 700,
            margin: "40px 0 16px",
            textTransform: "uppercase",
          }}
        >
          People You've Brought In
        </h2>
        {recentReferrals.length === 0 ? (
          <div
            style={{
              background: colors.bgElevated,
              border: `0.5px solid ${colors.border}`,
              padding: 24,
              textAlign: "center",
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            Nobody yet. Share your code.
          </div>
        ) : (
          <div
            style={{
              background: colors.bgElevated,
              border: `0.5px solid ${colors.border}`,
              fontFamily: fonts.mono,
              fontSize: 12,
            }}
          >
            {recentReferrals.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 16,
                  padding: "12px 16px",
                  borderTop: i === 0 ? "none" : `0.5px solid ${colors.border}`,
                  alignItems: "center",
                }}
              >
                <span style={{ color: colors.text }}>{r.callsign ?? r.email}</span>
                <span
                  style={{
                    color:
                      r.status === "active"
                        ? colors.accent
                        : r.status === "pending"
                          ? colors.warning
                          : colors.textDim,
                    fontSize: 10,
                    letterSpacing: "0.3em",
                  }}
                >
                  {r.status.toUpperCase()}
                </span>
                <span style={{ color: colors.textDim, fontSize: 11 }}>
                  {new Date(r.submittedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeCode && (
          <div style={{ marginTop: 32 }}>
            <details>
              <summary
                style={{
                  cursor: "pointer",
                  color: colors.textMuted,
                  fontSize: 11,
                  fontFamily: fonts.mono,
                  letterSpacing: "0.3em",
                }}
              >
                ADVANCED ▸
              </summary>
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  background: colors.bgElevated,
                  border: `0.5px solid ${colors.border}`,
                }}
              >
                <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>
                  Regenerating creates a fresh code and revokes the old one. People with the old code or QR will get an error.
                </p>
                <form action={regenerateMyCode}>
                  <button
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      background: "transparent",
                      color: "#ff8a8a",
                      border: `0.5px solid #663030`,
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.3em",
                      cursor: "pointer",
                    }}
                  >
                    REGENERATE CODE
                  </button>
                </form>
              </div>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      style={{
        background: highlight && value > 0 ? colors.accentSoft : colors.bgElevated,
        border: `0.5px solid ${highlight && value > 0 ? colors.accent : colors.border}`,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.3em",
          color: highlight && value > 0 ? colors.accent : colors.textMuted,
          fontFamily: fonts.mono,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: highlight && value > 0 ? colors.accent : colors.text,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
}
