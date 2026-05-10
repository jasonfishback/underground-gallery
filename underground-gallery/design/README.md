# Handoff: Underground Gallery — Mobile Redesign

> Imported from the design handoff zip on 2026-05-10. The Mobile Boot.html
> prototype is the source of truth for the boot animation; the design tokens
> below have been partially applied to `app/globals.css`. Full cinematic boot
> sequence + form-card modal is still TODO — see "Implementation status" at
> the bottom.

## Overview
Redesign of the Underground Gallery member-gated mobile experience (undergroundgallery.ai). Covers the cinematic boot sequence, the "Members only" landing, and the two-step authentication flow (email → 6-digit code).

The brief: keep the original site's palette and "boot screen" character but push it into a more modern, exclusive, tech-forward feel — iOS-style frosted-glass surfaces, automotive/instrument-cluster details, and high-contrast motion design.

## About the Design Files
The files in this bundle are **design references built in HTML/React (via in-browser Babel)** — interactive prototypes showing intended look, motion, and behavior. They are **not production code** to copy directly.

The task is to **recreate these designs in the target codebase's existing environment** (Next.js / React / Tailwind / whatever the underground-gallery repo uses) following its established patterns, component library, routing, and auth flow.

## Fidelity
**High-fidelity (hifi).** Pixel-perfect mockups with final colors, typography, spacing, animation curves, and interaction states.

## Screens / Views

### 1. Boot Sequence (`<BootSequence>`)
Full-screen, dark-mode-only intro. Runs once per session, replays via the "Reset boot" affordance.

**Phases** (state-machine, ms timings on `phase` integer 0–4):
- **0 — Matrix intro** (~1700ms): RGB-shifted SVG-turbulence static + horizontal scanline band sweep + flickering "∕∕ SIGNAL ACQUIRING" caption.
- **1 — Initializing system** (~1400ms): Loader emerges. Center monogram (the aperture-tach mark) fades in; corner crosshairs settle; ticker reels.
- **2 — Authenticating session** (~1600ms): Status word swaps to "Authenticating session"; perimeter sweep ramps up.
- **3 — Access granted** (~1200ms): Center dot turns green (`#7df0a6`); status flips to "Welcome back, member."; brief flash, then hand-off to landing.
- **4 — Done**: `onComplete()` fires, parent unmounts the boot.

### 2. Landing — "Members only" (`<Landing>`)
Sits inside the iPhone viewport after `BootSequence` completes.

Layout:
- Top bar: `∕∕ UG` mono mark left, `SESSION · 0x…` right.
- Corner crosshairs in all four corners (decorative).
- Hero block:
  - Eyebrow: `MEMBERS ONLY` — 10px mono, accent red.
  - Title: 34px Inter Tight 700, "Access the gallery."
  - Sub: 14px Inter Tight 400, "Members run the lot. Sign in to your stall."
- CTA stack: tinted-glass primary "Send sign-in link" + clear-glass secondary "I have a code".
- Footer micro-row: "NEW HERE? — request invitation".

### 3. Form Cards (`<FormCard>`)
Modal-style sheet that slides up over the landing. Two modes: `invite` (email) and `code` (6-digit OTP).

## Design Tokens (already in `app/globals.css`)

### Colors
| Token | Value | Usage |
|---|---|---|
| `--ug-bg` / `#08070a` | Page background |
| `--ug-accent` / `#ff2a2a` | Primary accent |
| `--ug-success` / `#7df0a6` | Verified state |
| `--ug-fg` / `#f5f6f7` | Titles |

### Typography
- **Inter Tight** 300/400/500/600/700/800 — display & UI text.
- **JetBrains Mono** 300/400/500/700 — labels, hex hashes, status ticker.

### Glass surfaces
- `.ug-glass` — neutral chrome (already in globals.css)
- `.ug-glass-tinted` — red tint variant (added 2026-05-10)
- `.ug-grain` — film grain overlay (added 2026-05-10)
- `.ug-vignette` — radial darken (added 2026-05-10)
- `.ug-wordmark` — chrome-textured wordmark with rotisserie (added 2026-05-10)
- `.ug-shimmer` — CTA shimmer overlay (added 2026-05-10)
- `.ug-corners` + `.ug-corner-{tl,tr,bl,br}` — crosshair brackets (added 2026-05-10)

### Animation keyframes (already in globals.css)
| Name | Duration | Easing | Purpose |
|---|---|---|---|
| `ugRotisserie` | 7s | `cubic-bezier(.45,.05,.55,.95)` infinite | Wordmark Y-axis spin |
| `ugShimmer` | 4.2s | ease-in-out infinite (1s delay) | Button highlight pass |
| `ugGlassRise` | 240ms | ease-out | Form card entrance |
| `ugCornersIn` | 600ms | ease-out | Corner crosshair settle |
| `ugBlink`, `ugPulse`, `ugSlideUp`, `ugFadeIn`, `ugScaleIn` | various | various | Misc UI |

## Implementation status (2026-05-10)

| Surface | Status | Where |
|---|---|---|
| Design tokens / glass / grain / vignette | ✓ Applied | `app/globals.css` |
| `.ug-wordmark` chrome text + rotisserie | ✓ Applied | `app/globals.css` |
| Corner crosshairs | ✓ Applied | `app/globals.css` |
| Members-only landing page | ✓ Built (simplified — no boot animation) | `app/page.tsx` |
| Cinematic boot sequence | ⏳ TODO | needs phased state machine + tach SVG |
| Form-card modal (auth flow) | ⏳ TODO | currently uses existing `/auth/signin` page |
| Tach monogram SVG | ⏳ TODO | computed tick positions, sweep dasharray |
| Verification readout / OTP UI | ⏳ TODO | currently linear form |

## Files in this folder
- `README.md` — this file (canonical design spec)
- `Mobile Boot.html` — full prototype (in `_restyle_staging/` until next pass)
- `ios-frame.jsx` — design-time iPhone bezel wrapper (do not ship)

The `_restyle_staging/` folder at the repo root contains the full original prototype HTML and JSX wrapper as reference for whoever picks up the boot animation work next.
