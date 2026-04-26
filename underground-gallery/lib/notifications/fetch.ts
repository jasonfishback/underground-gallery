// lib/notifications/fetch.ts
//
// Server helper for loading the current user's recent notifications.
// Used by the layout/header to render the notification bell.

import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';

export async function getRecentNotifications(userId: string, limit = 20) {
  return db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      link: notifications.link,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
