# Underground Gallery

Next.js 14 app. Static landing pages in `/public`, two API routes (`/api/apply`, `/api/waitlist`), Vercel KV for storage, Resend for email.

## First-time deploy

1. **Upload this folder to a new GitHub repo** (drag-and-drop in the GitHub web UI works)
2. **Import the repo on Vercel** → it auto-detects Next.js, no settings to change
3. **Storage tab on Vercel** → Create KV database → connect to this project (auto-injects `KV_*` env vars)
4. **Settings → Environment Variables** → add:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (must be on a domain verified in Resend)
   - `RESEND_FROM_NAME`
   - `ADMIN_EMAILS` (comma-separated)
   - `ADMIN_TOKEN` (long random string — generate at https://generate-secret.vercel.app/32)
   - `NEXT_PUBLIC_WAITLIST_BASELINE` (e.g. `114`)
   - `NEW_APPLICATION_WEBHOOK_URL` (optional Slack/Discord)
5. **Settings → Domains** → add `undergroundgallery.ai` and `www.undergroundgallery.ai`, update DNS at registrar per Vercel's instructions
6. **Redeploy** so the env vars apply (Deployments tab → latest → ⋯ → Redeploy)

## Ongoing edits (no bash, no CLI)

- Edit files directly on github.com (pencil icon on any file), or press `.` on the repo to open a full VS Code editor in the browser
- Commit to `main` → Vercel auto-deploys in ~90 seconds
- Open a branch + PR if you want a preview URL before going live

## Routes

| URL | Serves |
|---|---|
| `/` (desktop) | `public/landing.html` |
| `/m` (mobile) | `public/mobile.html` (auto-redirected from `/` on mobile UA) |
| `/garage` | `public/invite.html` |
| `/share` | `public/share.html` |
| `/invite/:slug` | `public/invite-share.html` |
| `/moderator` | `public/moderator.html` (gate with `?token=ADMIN_TOKEN`) |
| `/privacy`, `/terms` | React pages in `app/` |

Override device detection: append `?desktop=1` or `?mobile=1` to any URL (sticky for 7 days via cookie).

## API

- `POST /api/apply` — body `{ email, name?, callsign?, region?, drive?, instagram?, invitedBy?, message? }` → stores in KV, sends Resend confirmation
- `GET /api/waitlist` → `{ count, real, baseline }` (cached 30s at the edge)
