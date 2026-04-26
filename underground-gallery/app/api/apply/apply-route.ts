// ============================================================================
// app/api/apply/route.ts
//
// FULL REPLACEMENT.
//
// Old version: stored applications in Vercel KV. New version writes to the
// `applications` Postgres table (which already exists) and validates the
// invite code against the new `invite_codes` table.
//
// On success:
//   - Inserts/updates an application row
//   - If a valid invite code is provided, sets applications.invitedBy =
//     code owner's userId (so admin referral leaderboard works)
//   - Sends Resend email notification (preserved from old route)
//
// Body (JSON):
//   {
//     email:      string (required),
//     callsign?:  string,
//     region?:    string,
//     drive?:     string,         // their daily / favorite ride
//     instagram?: string,
//     inviteCode?: string,        // optional, validated case-insensitive
//     message?:   string
//   }
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, sql, and } from "drizzle-orm";
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
  // If you'd rather hard-require a valid code, change this to:
  //   if (inviteCodeStatus !== 'ok') return 400.

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
      // Other columns left to defaults / null
    });
  }

  // ---- Insert (or replace) the application ----
  const applicationId = randomUUID();
  await db
    .insert(applications)
    .values({
      id: applicationId,
      userId,
      callsign,
      region,
      drive,
      instagram,
      invitedBy: inviterUserId, // userId, NOT free string anymore
      message,
      status: "pending",
      submittedAt: new Date(),
    })
    // If a previous pending app exists for this user, this naive insert
    // would fail the FK; in practice users.id is unique so we only ever
    // append — admin can decide if they want to reject the older one.
    ;

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
          subject: `Application: ${callsign ?? email}`,
          text: [
            `New application submitted.`,
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
        // don't fail the whole request
      }
    }
  }

  return NextResponse.json({
    ok: true,
    applicationId,
    inviteCode: inviteCodeStatus,
  });
}
