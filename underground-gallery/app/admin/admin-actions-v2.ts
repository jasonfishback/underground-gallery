// ============================================================================
// app/admin/actions.ts — REVISED VERSION
// Replaces previous batch's admin-actions.ts. Fixes wrong column names:
//   - applications.decidedAt (was: reviewedAt)
//   - applications.decidedBy (was: reviewedBy)
//   - applications.rejectReason (used on reject)
// Also reflects moderationEvents real columns (applicationId, actorId).
// ============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, applications, moderationEvents } from "@/lib/db/schema";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in.");
  const me = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, isModerator: true },
  });
  if (!me?.isModerator) throw new Error("Admins only.");
  return me;
}

export async function approveApplication(applicationId: string) {
  const me = await requireAdmin();

  const app = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
  });
  if (!app) throw new Error("Application not found.");

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({ status: "approved", decidedAt: new Date(), decidedBy: me.id })
      .where(eq(applications.id, applicationId));

    await tx
      .update(users)
      .set({ status: "active", approvedAt: new Date() })
      .where(eq(users.id, app.userId));

    await tx.insert(moderationEvents).values({
      id: randomUUID(),
      applicationId,
      actorId: me.id,
      action: "approve_application",
      reason: null,
    });
  });

  revalidatePath("/admin");
  revalidatePath("/members");
}

export async function rejectApplication(
  applicationId: string,
  reason: string | null = null,
) {
  const me = await requireAdmin();

  const app = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
  });
  if (!app) throw new Error("Application not found.");

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({
        status: "rejected",
        decidedAt: new Date(),
        decidedBy: me.id,
        rejectReason: reason,
      })
      .where(eq(applications.id, applicationId));

    await tx
      .update(users)
      .set({ status: "rejected", rejectedAt: new Date() })
      .where(eq(users.id, app.userId));

    await tx.insert(moderationEvents).values({
      id: randomUUID(),
      applicationId,
      actorId: me.id,
      action: "reject_application",
      reason,
    });
  });

  revalidatePath("/admin");
}
