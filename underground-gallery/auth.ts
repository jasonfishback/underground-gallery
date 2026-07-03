// auth.ts
// Auth.js v5 configuration for Underground Gallery.
//
// Auth flow:
//   1. User submits email on /auth/signin
//   2. Auth.js creates a verification_token row, sends magic link via Resend
//   3. User clicks link → Auth.js verifies token, creates user (if new) and session
//   4. NEW users: routed to /setup to choose callsign / region / garage
//   5. POST-SETUP users: routed to /pending-approval until a moderator decides
//   6. APPROVED users: full access
//   7. REJECTED users: still allowed to sign in — they land on /pending-approval
//      and see the rejection reason. Approval state lives on `applications.status`.
//
// Key gotchas baked in:
//   - Database session strategy (NOT JWT) so we can read user.status on every request
//   - Custom Resend HTML template matches the brand
//   - Email comparison is lowercased everywhere (Postgres index is case-sensitive)

import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { customAlphabet } from 'nanoid';
import { db } from '@/lib/db';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Short, typeable sign-in code (also the magic-link token). Ambiguous
// characters removed (no 0/O/1/I/L). ~31^8 combos + 1h single-use expiry.
// Lets the PWA complete sign-in with a CODE the user types IN THE APP, instead
// of a link that opens Safari in a separate cookie jar (iOS home-screen apps).
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const generateSignInCode = customAlphabet(CODE_ALPHABET, 8);

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
session: { strategy: 'database', maxAge: 90 * 24 * 60 * 60 },

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
      // Codes/links expire in 1 hour (short since it's now a typeable code too).
      maxAge: 60 * 60,
      generateVerificationToken: () => generateSignInCode(),
      // Custom email so it matches the brand
      sendVerificationRequest: async ({
        identifier: email,
        url,
        token,
        provider,
      }) => {
        const { host } = new URL(url);
        const code = token; // same value the magic link carries
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to: email,
            subject: `Your ${host} code: ${code} // ACCESS RESTRICTED`,
            html: buildEmail({ url, host, code }),
            text: buildEmailText({ url, host, code }),
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
    },
  },

  trustHost: true,
});

// ─── Email templates ──────────────────────────────────────────────────────

function formatCode(code: string): string {
  // Group as XXXX-XXXX for readability; the app strips the dash on entry.
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

function buildEmail({ url, host, code }: { url: string; host: string; code: string }) {
  const pretty = formatCode(code);
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
                Your sign-in code
              </h1>

              <p style="font-size:15px;color:rgba(201,204,209,0.75);line-height:1.6;margin:0 0 24px;">
                Enter this code in the app to sign in to ${host}. Best if you opened the app from your home screen.
              </p>

              <div style="margin:0 0 28px;padding:20px;background:#05060a;border:1px solid rgba(255,42,42,0.35);text-align:center;">
                <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:34px;font-weight:800;letter-spacing:0.22em;color:#ff5a5a;">
                  ${pretty}
                </div>
              </div>

              <p style="font-size:13px;color:rgba(201,204,209,0.55);line-height:1.6;margin:0 0 28px;">
                Or just tap this button to sign in on this device:
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

              <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;color:rgba(201,204,209,0.4);letter-spacing:0.24em;">
                Code and link expire in 1 hour, single use. If you didn't request this, ignore it — no account is created.
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

function buildEmailText({ url, host, code }: { url: string; host: string; code: string }) {
  return `// ACCESS RESTRICTED

Your sign-in code for ${host}:

    ${formatCode(code)}

Enter it in the app to sign in (best if you opened the app from your home screen).

Or sign in on this device with this link:
${url}

Code and link expire in 1 hour and can only be used once.

If you didn't request this, ignore the email. No account will be created.

— Underground Gallery`;
}
