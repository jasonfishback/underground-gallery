// ============================================================================
// app/api/apply/route.ts
//
// Writes to the `applications` Postgres table and validates invite codes
// against the `invite_codes` table.
//
// 2026-05-09 fix: previous version did a plain INSERT into `applications`,
// but the schema has a unique index on user_id WHERE NOT NULL. So a user
// who submitted the form twice (typo'd callsign, switched browser, etc.)
// hit a unique-constraint 500. This version is idempotent:
//   - if the user already has a pending application -> UPDATE in place
//   - if the user already has an approved/rejected application -> reject
//     the resubmit cleanly (409) so the form can show a friendly message
//   - otherwise INSERT
//
// Body (JSON):
//   {
//     email:       string (required),
//     callsign?:   string,
//     region?:     string,
//     drive?:      string,         // their daily / favorite ride
//     instagram?:  string,
//     inviteCode?: string,         // optional, validated case-insensitive
//     message?:    string
//   }
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { Resend } from "resend";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { users, applications, inviteCodes } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

const FROM =
  process.env.RESEND_FROM_EMAIL ??
  process.env.RESEND_FROM_ADDRESS ??
  "Underground Gallery <noreply@undergroundgallery.ai>";

function clamp(s: unknown, max: number): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  return t.length > max ? t.substring(0, max) : t;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email = clamp(body?.email, 320)?.toLowerCase();
  if (!email || !isEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Valid email required." },
      { status: 400 },
    );
  }

  const callsign = clamp(body?.callsign, 32);
  const region = clamp(body?.region, 80);
  const drive = clamp(body?.drive, 200);
  const instagram = clamp(body?.instagram, 60)?.replace(/^@+/, "") ?? null;
  const message = clamp(body?.message, 1000);
  const rawInviteCode = clamp(body?.inviteCode, 32);

  // ---- Resolve invite code (if provided) ----
  let inviterUserId: string | null = null;
  let inviteCodeStatus: "ok" | "missing" | "invalid" | "revoked" =
    rawInviteCode ? "missing" : "missing";

  if (rawInviteCode) {
    const found = await db
      .select({
        id: inviteCodes.id,
        ownerUserId: inviteCodes.ownerUserId,
        isActive: inviteCodes.isActive,
      })
      .from(inviteCodes)
      .where(sql`LOWER(${inviteCodes.code}) = LOWER(${rawInviteCode})`)
      .limit(1);

    if (found.length === 0) {
      inviteCodeStatus = "invalid";
    } else if (!found[0].isActive) {
      inviteCodeStatus = "revoked";
    } else {
      inviteCodeStatus = "ok";
      inviterUserId = found[0].ownerUserId;
    }
  }

  // We do NOT block applications without a valid invite code — Jason can
  // still review them in admin. We just record the status.

  // ---- Find or create user shell ----
  // Auth.js will create the user properly on email magic-link verify, but
  // applications can be submitted before that. We upsert a "pending" user
  // shell keyed by email so the application can foreign-key to it.
  let userId: string;
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
  } else {
    userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      email,
      status: "pending",
    });
  }

  // ---- Idempotent application write ----
  // Schema has a unique index on applications.user_id WHERE NOT NULL.
  // So we look up existing first and either UPDATE or INSERT.
  const existingApp = await db
    .select({
      id: applications.id,
      status: applications.status,
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .limit(1);

  let applicationId: string;
  let resubmit = false;

  if (existingApp.length > 0) {
    const prev = existingApp[0];

    if (prev.status === "approved") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "You're already approved. Just sign in with this email — no need to apply again.",
        },
        { status: 409 },
      );
    }

    if (prev.status === "rejected") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This email has a previous decision on file. Reach out to the team if you think it should be revisited.",
        },
        { status: 409 },
      );
    }

    // pending -> update in place so the user can fix typos and resubmit
    applicationId = prev.id;
    resubmit = true;
    await db
      .update(applications)
      .set({
        callsign,
        region,
        drive,
        instagram,
        invitedBy: inviterUserId,
        message,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(applications.id, prev.id));
  } else {
    applicationId = randomUUID();
    await db.insert(applications).values({
      id: applicationId,
      userId,
      callsign,
      region,
      drive,
      instagram,
      invitedBy: inviterUserId,
      message,
      status: "pending",
      submittedAt: new Date(),
    });
  }

  // ---- Email notification (best-effort) ----
  if (resend) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (adminEmails.length > 0) {
      try {
        await resend.emails.send({
          from: FROM,
          to: adminEmails,
          subject: `${resubmit ? "Resubmitted" : "Application"}: ${callsign ?? email}`,
          text: [
            `${resubmit ? "Resubmitted" : "New"} application.`,
            ``,
            `Email:     ${email}`,
            `Callsign:  ${callsign ?? "(none)"}`,
            `Region:    ${region ?? "(none)"}`,
            `Drive:     ${drive ?? "(none)"}`,
            `Instagram: ${instagram ?? "(none)"}`,
            `Invite:    ${
              inviteCodeStatus === "ok"
                ? `valid (inviter user_id=${inviterUserId})`
                : inviteCodeStatus
            }${rawInviteCode ? ` — entered "${rawInviteCode}"` : ""}`,
            ``,
            `Message:`,
            message ?? "(none)",
            ``,
            `Review at: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://undergroundgallery.ai"}/admin`,
          ].join("\n"),
        });
      } catch (err) {
        console.error("[apply] resend failed:", err);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    applicationId,
    inviteCode: inviteCodeStatus,
    resubmitted: resubmit,
  });
}
