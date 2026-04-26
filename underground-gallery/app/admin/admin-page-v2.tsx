// ============================================================================
// app/admin/page.tsx — REVISED VERSION
// Replaces the version from the previous batch. Key fixes:
//   1. Uses real applications columns: decidedAt/decidedBy/drive/instagram/message
//      (the prior version used reviewedAt/reviewedBy/answers — those don't exist)
//   2. Adds a Referral Leaderboard (top inviters, by approved count)
//   3. Resolves invitedBy (now a userId) into a callsign for display
// ============================================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc, sql, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  users,
  applications,
  vehicles,
  raceResults,
  moderationEvents,
  inviteCodes,
} from "@/lib/db/schema";
import { colors, fonts } from "@/lib/design";
import { approveApplication, rejectApplication } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?next=/admin");
  }

  const me = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, callsign: true, isModerator: true },
  });
  if (!me?.isModerator) redirect("/me");

  // Aliases for the inviter join
  const inviterUsers = users;

  // ---- Pending applications, joined to inviter callsign (if any) ----
  const pendingApps = await db
    .select({
      id: applications.id,
      userId: applications.userId,
      email: users.email,
      callsign: applications.callsign,
      submittedAt: applications.submittedAt,
      drive: applications.drive,
      instagram: applications.instagram,
      message: applications.message,
      region: applications.region,
      invitedBy: applications.invitedBy,
    })
    .from(applications)
    .innerJoin(users, eq(applications.userId, users.id))
    .where(eq(applications.status, "pending"))
    .orderBy(desc(applications.submittedAt))
    .limit(50);

  // Pull inviter callsigns in one round-trip
  const inviterIds = Array.from(
    new Set(
      pendingApps
        .map((a) => a.invitedBy)
        .filter((v): v is string => !!v && v.length > 0),
    ),
  );
  const inviterMap = new Map<string, string | null>();
  if (inviterIds.length > 0) {
    const inviters = await db
      .select({ id: users.id, callsign: users.callsign })
      .from(users)
      .where(sql`${users.id} = ANY(${inviterIds})`);
    for (const u of inviters) inviterMap.set(u.id, u.callsign);
  }

  // ---- Stats ----
  const [{ activeCount }] = await db
    .select({ activeCount: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.status, "active"));

  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)::int` })
    .from(users);

  const [{ vehicleCount }] = await db
    .select({ vehicleCount: sql<number>`count(*)::int` })
    .from(vehicles);

  const [{ raceCount }] = await db
    .select({ raceCount: sql<number>`count(*)::int` })
    .from(raceResults);

  // ---- Recent members ----
  const recentMembers = await db
    .select({
      id: users.id,
      callsign: users.callsign,
      email: users.email,
      isModerator: users.isModerator,
      approvedAt: users.approvedAt,
    })
    .from(users)
    .where(eq(users.status, "active"))
    .orderBy(desc(users.approvedAt))
    .limit(10);

  // ---- Mod log ----
  const recentMod = await db
    .select({
      id: moderationEvents.id,
      action: moderationEvents.action,
      reason: moderationEvents.reason,
      createdAt: moderationEvents.createdAt,
    })
    .from(moderationEvents)
    .orderBy(desc(moderationEvents.createdAt))
    .limit(8);

  // ---- Referral leaderboard ----
  // For each user, count: approved referrals, pending referrals, has-active-code
  type LB = {
    userId: string;
    callsign: string | null;
    email: string;
    approved: number;
    pending: number;
    hasCode: boolean;
  };

  const lbRows = await db.execute<{
    user_id: string;
    callsign: string | null;
    email: string;
    approved: number;
    pending: number;
    has_code: boolean;
  }>(sql`
    SELECT
      u.id   AS user_id,
      u.callsign,
      u.email,
      COALESCE(SUM(CASE WHEN target.status = 'active'  THEN 1 ELSE 0 END), 0)::int AS approved,
      COALESCE(SUM(CASE WHEN target.status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending,
      EXISTS (
        SELECT 1 FROM invite_codes ic
        WHERE ic.owner_user_id = u.id AND ic.is_active = TRUE
      ) AS has_code
    FROM users u
    LEFT JOIN applications a ON a.invited_by = u.id
    LEFT JOIN users target ON target.id = a.user_id
    WHERE u.status = 'active'
    GROUP BY u.id, u.callsign, u.email
    HAVING (
      COALESCE(SUM(CASE WHEN target.status IN ('active','pending') THEN 1 ELSE 0 END), 0) > 0
      OR EXISTS (
        SELECT 1 FROM invite_codes ic2
        WHERE ic2.owner_user_id = u.id AND ic2.is_active = TRUE
      )
    )
    ORDER BY approved DESC, pending DESC, u.callsign
    LIMIT 25
  `);

  const leaderboard: LB[] = (lbRows.rows ?? lbRows ?? []).map((r: any) => ({
    userId: r.user_id,
    callsign: r.callsign,
    email: r.email,
    approved: Number(r.approved ?? 0),
    pending: Number(r.pending ?? 0),
    hasCode: r.has_code === true || r.has_code === "t" || r.has_code === 1,
  }));

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.fg,
        fontFamily: fonts.sans,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.4em",
            color: colors.accent,
            marginBottom: 8,
          }}
        >
          ADMIN
        </div>
        <h1 style={{ fontSize: 32, margin: "0 0 8px", letterSpacing: "0.05em" }}>
          Control Tower.
        </h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 32, maxWidth: 600 }}>
          Approve members, watch the data, keep the place clean.
        </p>

        {/* STATS */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <Stat label="PENDING" value={pendingApps.length} highlight />
          <Stat label="ACTIVE MEMBERS" value={activeCount} />
          <Stat label="TOTAL USERS" value={totalUsers} />
          <Stat label="VEHICLES" value={vehicleCount} />
          <Stat label="RACES LOGGED" value={raceCount} />
        </section>

        {/* PENDING APPLICATIONS */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Pending Applications</SectionTitle>
          {pendingApps.length === 0 ? (
            <EmptyBox>No applications waiting. You're caught up.</EmptyBox>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingApps.map((app) => (
                <ApplicationRow
                  key={app.id}
                  app={app}
                  inviterCallsign={
                    app.invitedBy ? inviterMap.get(app.invitedBy) ?? null : null
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* REFERRAL LEADERBOARD */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Referral Leaderboard</SectionTitle>
          {leaderboard.length === 0 ? (
            <EmptyBox>No referrals yet.</EmptyBox>
          ) : (
            <div
              style={{
                background: colors.surface,
                border: `0.5px solid ${colors.border}`,
                fontFamily: fonts.mono,
                fontSize: 12,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto auto",
                  gap: 16,
                  padding: "10px 16px",
                  borderBottom: `0.5px solid ${colors.border}`,
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  color: "#666",
                  fontWeight: 700,
                }}
              >
                <span style={{ minWidth: 24 }}>#</span>
                <span>MEMBER</span>
                <span>APPROVED</span>
                <span>PENDING</span>
                <span>CODE</span>
              </div>
              {leaderboard.map((r, i) => (
                <div
                  key={r.userId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto auto",
                    gap: 16,
                    padding: "10px 16px",
                    borderTop: i === 0 ? "none" : `0.5px solid ${colors.border}`,
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#666", minWidth: 24 }}>{i + 1}</span>
                  <Link
                    href={r.callsign ? `/u/${r.callsign}` : "#"}
                    style={{
                      color: colors.fg,
                      textDecoration: "none",
                    }}
                  >
                    {r.callsign ?? r.email}
                  </Link>
                  <span style={{ color: colors.accent }}>{r.approved}</span>
                  <span style={{ color: "#aaa" }}>{r.pending}</span>
                  <span
                    style={{
                      color: r.hasCode ? "#88ff88" : "#666",
                      fontSize: 10,
                    }}
                  >
                    {r.hasCode ? "●" : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECENT MEMBERS */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Recently Approved</SectionTitle>
          {recentMembers.length === 0 ? (
            <EmptyBox>No active members yet.</EmptyBox>
          ) : (
            <div
              style={{
                background: colors.surface,
                border: `0.5px solid ${colors.border}`,
                fontFamily: fonts.mono,
                fontSize: 12,
              }}
            >
              {recentMembers.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto auto",
                    gap: 16,
                    padding: "12px 16px",
                    borderTop:
                      i === 0 ? "none" : `0.5px solid ${colors.border}`,
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: colors.fg }}>
                    {m.callsign ?? "(no callsign)"}
                    {m.isModerator ? (
                      <span
                        style={{
                          marginLeft: 8,
                          color: colors.accent,
                          fontSize: 10,
                          letterSpacing: "0.3em",
                        }}
                      >
                        ADMIN
                      </span>
                    ) : null}
                  </span>
                  <span style={{ color: "#888", fontSize: 11 }}>{m.email}</span>
                  <span style={{ color: "#666", fontSize: 11 }}>
                    {m.approvedAt
                      ? new Date(m.approvedAt).toLocaleDateString()
                      : "—"}
                  </span>
                  <Link
                    href={m.callsign ? `/u/${m.callsign}` : "#"}
                    style={{
                      color: colors.accent,
                      fontSize: 10,
                      letterSpacing: "0.3em",
                      textDecoration: "none",
                    }}
                  >
                    VIEW →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MOD LOG */}
        <section style={{ marginBottom: 48 }}>
          <SectionTitle>Moderation Log</SectionTitle>
          {recentMod.length === 0 ? (
            <EmptyBox>No moderation events yet.</EmptyBox>
          ) : (
            <div
              style={{
                background: colors.surface,
                border: `0.5px solid ${colors.border}`,
                fontFamily: fonts.mono,
                fontSize: 11,
                color: "#aaa",
              }}
            >
              {recentMod.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    padding: "10px 16px",
                    borderTop:
                      i === 0 ? "none" : `0.5px solid ${colors.border}`,
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ color: colors.accent, letterSpacing: "0.2em" }}
                  >
                    {e.action.toUpperCase()}
                  </span>
                  <span>{e.reason ?? ""}</span>
                  <span style={{ color: "#666" }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <SectionTitle>Quick Actions</SectionTitle>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <AdminLink href="/members">All Members →</AdminLink>
            <AdminLink href="/race/history">Race History →</AdminLink>
            <AdminLink href="/admin/init-db">DB Migrations →</AdminLink>
          </div>
        </section>
      </div>
    </main>
  );
}

// ---------- Subcomponents ----------

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background:
          highlight && value > 0 ? "rgba(255,48,48,0.08)" : colors.surface,
        border: `0.5px solid ${
          highlight && value > 0 ? colors.accent : colors.border
        }`,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.3em",
          color: highlight && value > 0 ? colors.accent : "#888",
          fontFamily: fonts.mono,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: highlight && value > 0 ? colors.accent : colors.fg,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        letterSpacing: "0.4em",
        color: "#888",
        fontFamily: fonts.mono,
        fontWeight: 700,
        margin: "0 0 16px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h2>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `0.5px solid ${colors.border}`,
        padding: 24,
        textAlign: "center",
        color: "#888",
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

function AdminLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "10px 18px",
        background: "transparent",
        border: `0.5px solid ${colors.border}`,
        color: "#aaa",
        fontFamily: fonts.mono,
        fontSize: 10,
        letterSpacing: "0.3em",
        textDecoration: "none",
        fontWeight: 700,
      }}
    >
      {children}
    </Link>
  );
}

function ApplicationRow({
  app,
  inviterCallsign,
}: {
  app: {
    id: string;
    userId: string;
    email: string;
    callsign: string | null;
    submittedAt: Date;
    drive: string | null;
    instagram: string | null;
    message: string | null;
    region: string | null;
    invitedBy: string | null;
  };
  inviterCallsign: string | null;
}) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `0.5px solid ${colors.border}`,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.fg }}>
            {app.callsign ?? "(no callsign)"}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#888",
              fontFamily: fonts.mono,
            }}
          >
            {app.email}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#666",
            fontFamily: fonts.mono,
            letterSpacing: "0.2em",
          }}
        >
          {new Date(app.submittedAt).toLocaleDateString()}
        </div>
      </div>

      {app.invitedBy && (
        <AnswerBlock label="INVITED BY">
          {inviterCallsign ?? `(user ${app.invitedBy.substring(0, 8)}…)`}
        </AnswerBlock>
      )}
      {app.drive && <AnswerBlock label="DRIVES">{app.drive}</AnswerBlock>}
      {app.region && <AnswerBlock label="REGION">{app.region}</AnswerBlock>}
      {app.instagram && (
        <AnswerBlock label="INSTAGRAM">@{app.instagram}</AnswerBlock>
      )}
      {app.message && <AnswerBlock label="MESSAGE">{app.message}</AnswerBlock>}

      <form
        style={{
          display: "flex",
          gap: 8,
          marginTop: 16,
          alignItems: "center",
        }}
      >
        <button
          formAction={async () => {
            "use server";
            await approveApplication(app.id);
          }}
          style={{
            padding: "8px 18px",
            background: colors.accent,
            color: "#0a0a0a",
            border: "none",
            fontFamily: fonts.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.3em",
            cursor: "pointer",
          }}
        >
          APPROVE
        </button>
        <button
          formAction={async () => {
            "use server";
            await rejectApplication(app.id);
          }}
          style={{
            padding: "8px 18px",
            background: "transparent",
            color: "#888",
            border: `0.5px solid ${colors.border}`,
            fontFamily: fonts.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.3em",
            cursor: "pointer",
          }}
        >
          REJECT
        </button>
      </form>
    </div>
  );
}

function AnswerBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.3em",
          color: "#666",
          fontFamily: fonts.mono,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}
