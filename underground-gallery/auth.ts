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
        // Cast: TS doesn't know about our custom columns yet; types/next-auth.d.ts fixes this.
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
    },
  },

  // Trust the Vercel deployment URL automatically (otherwise local dev breaks)
  trustHost: true,
});

// ─── Email templates ──────────────────────────────────────────────────────

function buildEmail({ url, host }: { url: string; host: string }) {
  // Inline-styled HTML so it survives every email client.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Sign in to Underground Gallery</title>
</head>
<body style="margin:0;padding:0;background:#05060a;color:#f5f6f7;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#05060a;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#0a0b10;border:1px solid rgba(255,42,42,0.18);">
          <tr>
            <td style="padding:40px 32px 32px;">

              <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#ff2a2a;letter-spacing:0.4em;font-weight:700;margin-bottom:20px;">
                ∕∕ ACCESS RESTRICTED
              </div>

              <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.02em;color:#f5f6f7;margin:0 0 16px;line-height:1.1;">
                Your sign-in link
              </h1>

              <p style="font-size:15px;color:rgba(201,204,209,0.75);line-height:1.6;margin:0 0 32px;">
                Click the button below to sign in to ${host}. This link expires in 24 hours and can only be used once.
              </p>

              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td>
                    <a href="${url}" style="display:inline-block;padding:16px 32px;background:#ff2a2a;color:#05060a;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:700;letter-spacing:0.3em;text-decoration:none;text-transform:uppercase;">
                      SIGN IN →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:rgba(201,204,209,0.4);line-height:1.6;margin:32px 0 0;">
                If the button doesn't work, paste this URL into your browser:<br/>
                <span style="color:rgba(201,204,209,0.6);word-break:break-all;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;">${url}</span>
              </p>

              <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;color:rgba(201,204,209,0.4);letter-spacing:0.24em;">
                If you didn't request this, ignore the email. No account will be created.
              </div>

            </td>
          </tr>
        </table>
        <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9px;color:rgba(201,204,209,0.3);letter-spacing:0.3em;margin-top:24px;text-transform:uppercase;">
          © MMXXVI · UNDERGROUND GALLERY
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText({ url, host }: { url: string; host: string }) {
  return `// ACCESS RESTRICTED

Sign in to ${host}.

${url}

This link expires in 24 hours and can only be used once.

If you didn't request this, ignore the email. No account will be created.

— Underground Gallery`;
}
