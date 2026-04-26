// auth.ts
// Auth.js v5 configuration for Underground Gallery.
//
// Auth flow:
//   1. User submits email on /auth/signin
//   2. Auth.js creates a verification_token row, sends magic link via Resend
//   3. User clicks link → Auth.js verifies token, creates user (if new) and session
//   4. NEW users: created with status='pending'; moderator reviews later
//   5. ACTIVE users: session created, can access members area
//   6. REJECTED users: blocked from signing in (signIn callback returns false)
//
// Key gotchas baked in:
//   - Database session strategy (NOT JWT) so we can read user.status on every request
//   - Custom Resend HTML template matches the brand
//   - Email comparison is lowercased everywhere (Postgres index is case-sensitive)

import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'accessrestricted@undergroundgallery.ai';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Underground Gallery';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  // Database sessions so we can read user.status server-side every request.
  session: { strategy: 'database' },

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/signin',
  },

  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      // Custom email so it matches the brand
      sendVerificationRequest: async ({
        identifier: email,
        url,
        provider,
      }) => {
        const { host } = new URL(url);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to: email,
            subject: `Sign in to ${host} // ACCESS RESTRICTED`,
            html: buildEmail({ url, host }),
            text: buildEmailText({ url, host }),
          }),
        });
        if (!res.ok) {
          throw new Error(
            `Resend error: ${res.status} ${await res.text()}`
          );
        }
      },
    }),
  ],

  callbacks: {
    // Block rejected users from signing in.
    // Pending users ARE allowed to sign in — but the app will route them to /pending.
    async signIn({ user }) {
      if (!user.email) return false;
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email.toLowerCase()))
        .limit(1);
      if (existing.length > 0 && existing[0].status === 'rejected') {
        return false;
      }
      return true;
    },

    // Add status, isModerator, callsign to the session so we can check them anywhere.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const u = user as typeof user & {
          status?: 'pending' | 'active' | 'rejected';
          isModerator?: boolean;
          callsign?: string | null;
        };
        session.user.status = u.status ?? 'pending';
        session.user.isModerator = u.isModerator ?? false;
        session.user.callsign = u.callsign ?? null;
      }
      return session;
    },
  },

  events: {
    // When a brand-new user is created via magic link, mark them as moderator
    // if their email is in ADMIN_EMAILS env var.
    async createUser({ user }) {
      if (!user.email || !user.id) return;
      const email = user.email.toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        await db
          .update(users)
          .set({ isModerator: true, status: 'active', approvedAt: new Date() })
          .where(eq(users.id, user.id));
      }
