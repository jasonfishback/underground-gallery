// ============================================================================
// app/invites/actions.ts
// Server actions for the invites page.
//   - ensureMyCode():    creates a code if the member doesn't have one yet
//   - regenerateMyCode(): revokes the current active code and issues a new one
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, inviteCodes } from "@/lib/db/schema";

// 8-char codes from an unambiguous alphabet (no O/0/1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newCodeString(): string {
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

async function requireActiveUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in.");
  const me = await (async () => { const [_u] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1); return _u ?? null; })();
  if (!me || me.status !== "active") throw new Error("Active members only.");
  return me;
}

/**
 * Ensure the current user has at least one active invite code.
 * Idempotent â€” safe to call on every page load.
 */
export async function ensureMyCode() {
  const me = await requireActiveUser();

  const existing = await db
    .select({ id: inviteCodes.id })
    .from(inviteCodes)
    .where(
      and(
        eq(inviteCodes.ownerUserId, me.id),
        eq(inviteCodes.isActive, true),
      ),
    )
    .limit(1);

  if (existing.length > 0) return { ok: true, created: false };

  // Try a few times in case of code collision
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = newCodeString();
    try {
      await db.insert(inviteCodes).values({
        id: randomUUID(),
        ownerUserId: me.id,
        code: candidate,
        isActive: true,
      });
      return { ok: true, created: true, code: candidate };
    } catch (err: any) {
      // unique violation -> try again with a different code
      if (
        err?.code === "23505" ||
        String(err?.message ?? "").includes("invite_codes_code_uniq")
      ) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    "Could not generate a unique code after 8 attempts. Try again.",
  );
}

/**
 * Revoke the current active code (if any) and create a new one.
 * Triggered from the "Regenerate" button on /invites.
 */
export async function regenerateMyCode() {
  const me = await requireActiveUser();

  await db.transaction(async (tx) => {
    await tx
      .update(inviteCodes)
      .set({ isActive: false, revokedAt: new Date() })
      .where(
        and(
          eq(inviteCodes.ownerUserId, me.id),
          eq(inviteCodes.isActive, true),
        ),
      );

    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = newCodeString();
      try {
        await tx.insert(inviteCodes).values({
          id: randomUUID(),
          ownerUserId: me.id,
          code: candidate,
          isActive: true,
        });
        revalidatePath("/invites");
        return;
      } catch (err: any) {
        if (
          err?.code === "23505" ||
          String(err?.message ?? "").includes("invite_codes_code_uniq")
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new Error("Could not generate a unique code. Try again.");
  });

  revalidatePath("/invites");
}
