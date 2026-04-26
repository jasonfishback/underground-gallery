// app/api/auth/[...nextauth]/route.ts
// Catch-all route that handles all Auth.js endpoints:
//   POST /api/auth/signin     — submit email
//   GET  /api/auth/callback   — verify magic link token
//   POST /api/auth/signout    — sign out
//   GET  /api/auth/session    — current session
//   GET  /api/auth/csrf       — CSRF token
//
// All wired up automatically — we just re-export the handlers from auth.ts.

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
