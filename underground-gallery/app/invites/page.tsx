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

  const me = await (async () => { const [_u] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1); return _u ?? null; })();

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
          className="ug-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.4em",
            color: colors.accent,
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          ∕∕ INVITES
        </div>
        <h1 style={{ fontSize: 32, margin: "0 0 8px", letterSpacing: "-0.02em", fontWeight: 800 }}>
          Your Code.
        </h1>
        <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 32, maxWidth: 600, lineHeight: 1.6 }}>
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
            className="ug-card"
            style={{
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
                className="ug-btn ug-btn-primary"
                style={{ fontFamily: fonts.mono }}
              >
                GENERATE CODE
              </button>
            </form>
          </div>
        )}

        <h2
          className="ug-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.4em",
            color: colors.textMuted,
            fontWeight: 700,
            margin: "40px 0 16px",
            textTransform: "uppercase",
          }}
        >
          ∕∕ People You've Brought In
        </h2>
        {recentReferrals.length === 0 ? (
          <div
            className="ug-card"
            style={{
              padding: 24,
              textAlign: "center",
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            Nobody yet. Share your code.
          </div>
        ) : (
          <ul className="ug-list" style={{ fontFamily: fonts.mono, fontSize: 12 }}>
            {recentReferrals.map((r, i) => (
              <li key={i}>
                <div
                  className="ug-list-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: 16,
                    alignItems: "center",
                    cursor: "default",
                  }}
                >
                  <span style={{ color: colors.text }}>{r.callsign ?? r.email}</span>
                  <span
                    className="ug-list-meta"
                    style={{
                      color:
                        r.status === "active"
                          ? colors.accent
                          : r.status === "pending"
                            ? colors.warning
                            : colors.textDim,
                    }}
                  >
                    {r.status.toUpperCase()}
                  </span>
                  <span style={{ color: colors.textDim, fontSize: 11 }}>
                    {new Date(r.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {activeCode && (
          <div style={{ marginTop: 32 }}>
            <details>
              <summary
                className="ug-mono"
                style={{
                  cursor: "pointer",
                  color: colors.textMuted,
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                }}
              >
                Advanced ▸
              </summary>
              <div
                className="ug-card"
                style={{
                  marginTop: 12,
                  padding: 16,
                }}
              >
                <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                  Regenerating creates a fresh code and revokes the old one. People with the old code or QR will get an error.
                </p>
                <form action={regenerateMyCode}>
                  <button
                    type="submit"
                    className="ug-btn ug-btn-ghost"
                    style={{ fontFamily: fonts.mono, fontSize: 10, padding: "8px 16px" }}
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
  const isHot = !!highlight && value > 0;
  return (
    <div
      className="ug-card"
      style={{
        padding: "16px 18px",
        background: isHot
          ? `linear-gradient(180deg, ${colors.accentSoft} 0%, rgba(255,42,42,0.04) 100%)`
          : undefined,
        borderColor: isHot ? colors.accentBorder : undefined,
      }}
    >
      <div
        className="ug-mono"
        style={{
          fontSize: 9,
          letterSpacing: "0.3em",
          color: isHot ? colors.accent : colors.textMuted,
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
          color: isHot ? colors.accent : colors.text,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
}
