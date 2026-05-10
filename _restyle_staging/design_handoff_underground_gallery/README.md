# Handoff: Underground Gallery — Mobile Redesign

## Overview
Redesign of the Underground Gallery member-gated mobile experience (undergroundgallery.ai). Covers the cinematic boot sequence, the "Members only" landing, and the two-step authentication flow (email → 6-digit code).

The brief: keep the original site's palette and "boot screen" character but push it into a more modern, exclusive, tech-forward feel — iOS-style frosted-glass surfaces, automotive/instrument-cluster details, and high-contrast motion design.

## About the Design Files
The files in this bundle are **design references built in HTML/React (via in-browser Babel)** — interactive prototypes showing intended look, motion, and behavior. They are **not production code** to copy directly.

The task is to **recreate these designs in the target codebase's existing environment** (Next.js / React / Tailwind / whatever the underground-gallery repo uses) following its established patterns, component library, routing, and auth flow. If no environment is established for a given surface, choose the framework that best fits the rest of the app.

## Fidelity
**High-fidelity (hifi).** Pixel-perfect mockups with final colors, typography, spacing, animation curves, and interaction states. Recreate the UI pixel-perfectly using the codebase's existing libraries and patterns. Inline `<style>` rules in the prototype encode the source of truth for tokens — see the **Design Tokens** section below.

## Screens / Views

### 1. Boot Sequence (`<BootSequence>`)
Full-screen, dark-mode-only intro. Runs once per session, replays via the "Reset boot" affordance.

**Phases** (state-machine, ms timings on `phase` integer 0–4):
- **0 — Matrix intro** (~1700ms): RGB-shifted SVG-turbulence static + horizontal scanline band sweep + flickering "∕∕ SIGNAL ACQUIRING" caption.
- **1 — Initializing system** (~1400ms): Loader emerges. Center monogram (the aperture-tach mark) fades in; corner crosshairs settle; ticker reels.
- **2 — Authenticating session** (~1600ms): Status word swaps to "Authenticating session"; perimeter sweep ramps up.
- **3 — Access granted** (~1200ms): Center dot turns green (`#7df0a6`); status flips to "Welcome back, member."; brief flash, then hand-off to landing.
- **4 — Done**: `onComplete()` fires, parent unmounts the boot.

**Layout**: absolutely-positioned layers inside the iPhone viewport (390 × 844 logical px). Z-order, bottom up:
1. Background `#08070a`
2. Residual static (`<svg feTurbulence>` as data URI, phase 1–3, opacity 0.08–0.18)
3. Matrix-intro overlay (phase 0 only)
4. Corner crosshair brackets (~16px arms, 1px `rgba(255,42,42,0.45)`, inset 28px)
5. Center monogram — see SVG below
6. Perimeter sweep — circular `<svg>` stroke with `stroke-dasharray: 60 540` + `6 600` highlight, 3.4s linear infinite
7. Bottom status block (status word + rolling hex hash + STEP indicator)
8. Top-left wordmark + top-right session ID
9. `.ug-grain` overlay, `mix-blend-mode: overlay`, opacity 0.5
10. `.ug-vignette` radial darken

**Center monogram (aperture tach)** — exact SVG in `Mobile Boot.html` under the `center monogram` comment. Composition:
- Outer bezel: `radial-gradient(#3a3a44 → #15151c → #000)`, 96px radius, 0.8px white-12% hairline
- Tick ring: 33 ticks across a 270° arc starting at 135°. Major ticks every 4th, 1.4px, length 10. Minor ticks 0.55px, length 4. Ticks at index ≥ 6.7/8 of the arc switch to `#ff2a2a`.
- Redline arc: from index 6.7 to 8.4, 3px stroke, `drop-shadow(0 0 4px #ff2a2a)`.
- Animated sweep: two overlapping arc paths, one red with `60 540` dasharray, one white with `6 600` dasharray (the "comet head"), both `ugTachSweepDash 3.4s linear infinite`.
- Inner well: 32px radius `radial-gradient(#15151c → #000)` + red glow overlay.
- U-glyph: `path("M 86 84 L 86 112 Q 86 117 91 117 L 109 117 Q 114 117 114 112 L 114 84")`, 3.4px stroke, chrome gradient `#fff → #cfd2d6 → #5a5d64`.
- Center dot: 3.4px radius. Red `#ff2a2a` during boot, green `#7df0a6` at phase ≥ 3, with matching `drop-shadow`.
- Top sheen: subtle `radial-gradient(rgba(255,255,255,0.18) → 0)` from upper-left.

**UNDERGROUND wordmark** (top of bottom status block in phase < 2):
- Font: JetBrains Mono 700, `letter-spacing: 0.32em`, ~14px.
- Chrome fill: `linear-gradient(180deg, #fff 0%, #cfd2d6 50%, #6a6d74 100%)` with `background-clip: text`.
- Multi-layer text-shadow: `0 1px 0 rgba(0,0,0,0.5), 0 2px 0 rgba(0,0,0,0.4), 0 6px 14px rgba(0,0,0,0.6), 0 0 18px rgba(255,42,42,0.18)`.
- Animation: `ugRotisserie 7s cubic-bezier(.45,.05,.55,.95) infinite` — full 360° rotateX on `transform-style: preserve-3d`.

### 2. Landing — "Members only" (`<Landing>`)
Sits inside the iPhone viewport after `BootSequence` completes.

**Layout** (top → bottom, 24px horizontal padding, 18px vertical gap):
- Top bar: `∕∕ UG` mono mark left, `SESSION · 0x…` right (both 10px JetBrains Mono, `TEXT_LOW`).
- Corner crosshairs in all four corners (decorative).
- Hero block:
  - Eyebrow: `MEMBERS ONLY` — 10px mono, accent red, `letter-spacing: 0.4em`.
  - Title: 34px Inter Tight 700, `#f5f6f7`, line-height 1.05, `letter-spacing: -0.02em`. Copy: "Access the gallery."
  - Sub: 14px Inter Tight 400, `TEXT_MID`, line-height 1.45. Copy: "Members run the lot. Sign in to your stall."
- CTA stack (12px gap):
  - **Primary (tinted glass)**: "Send sign-in link" → opens `<FormCard mode="invite">`. Uses `.ug-glass-tinted`.
  - **Secondary (clear glass)**: "I have a code" → opens `<FormCard mode="code">`. Uses `.ug-glass`.
  - Both 56px tall, 14px radius, full-width, 15px Inter Tight 600. Shimmer overlay sweeps once at 1s, then every 4.2s.
- Footer micro-row: "NEW HERE? — request invitation" link, mono 10px, accent red.

### 3. Form Cards (`<FormCard>`)
Modal-style sheet that slides up over the landing. Two modes: `invite` (email) and `code` (6-digit OTP).

**Layout**:
- Backdrop: `rgba(0,0,0,0.55)` + `backdrop-filter: blur(8px)`. Tap to dismiss.
- Card: `.ug-glass`, 18px radius, 24px padding, anchored bottom with 24px inset, `ugGlassRise` entrance (240ms).
- Back chevron top-left + step indicator top-right: `STEP 02 / 03` style, mono 10px.
- Eyebrow label (`∕∕ MEMBER EMAIL` or `∕∕ ACCESS CODE`), accent red.
- Title 22px Inter Tight 600.
- Sub 13px `TEXT_MID`.
- Input: 52px tall, 12px radius, transparent fill, 1px `rgba(255,255,255,0.14)` border. Focus → border `rgba(255,42,42,0.55)`, 0 0 0 4px `rgba(255,42,42,0.12)` ring. Mono font for the code mode.
- Submit (`.ug-glass-tinted`, 52px, 14px radius). Label: "Send link" / "Verify code".
- **Verification readout** (after submit): rolling 16-char hex hash, "CHECKING CREDENTIALS", 800ms.
- **Verified state**: green check, "VERIFIED", auto-dismiss after 700ms.

## Interactions & Behavior

- **Boot replay**: tap-and-hold (700ms) on the top-left `∕∕ UG` mark in the landing → resets `replayKey` → boot re-runs.
- **Form submit** (both modes): debounce 200ms, fake-verify 800ms, then "verified" 700ms, then close + fire `onAuthenticated(mode, value)`.
- **Keyboard**: Enter submits; Esc dismisses the form card.
- **Scroll**: the entire viewport is non-scrolling on the prototype; design assumes a fixed 844pt height. Real implementation should still gracefully handle smaller heights by reducing the hero block's bottom padding first.
- **Reduced motion**: respect `prefers-reduced-motion` — disable the matrix intro, rotisserie, comet sweep, and shimmer; cross-fade phases instead.

## State Management

```
type BootPhase = 0 | 1 | 2 | 3 | 4;
type Mode = 'landing' | 'invite' | 'code';
type FormState = 'idle' | 'submitting' | 'verifying' | 'verified' | 'error';

state = {
  bootPhase: BootPhase,
  replayKey: number,
  mode: Mode,
  email: string,
  code: string,
  formState: FormState,
}
```

Auth wiring: replace the simulated `setTimeout` chain in `<FormCard>` with real calls to the existing magic-link / OTP endpoints. The verified state should be reached only on a real 200 response.

## Design Tokens

### Colors
| Token | Value | Usage |
|---|---|---|
| `--bg` | `#08070a` | Page background |
| `--accent` | `#ff2a2a` | Primary accent, redline, ticks past 6.7k |
| `--accent-soft` | `rgba(255,42,42,0.32)` | Glows, focus rings |
| `--accent-deep` | `rgba(255,42,42,0.08)` | Tinted-glass base wash |
| `--success` | `#7df0a6` | Verified state, access-granted dot |
| `--text-hi` | `#f5f6f7` | Titles |
| `--text-mid` | `rgba(232,228,224,0.62)` | Body copy |
| `--text-low` | `rgba(201,204,209,0.38)` | Micro labels, mono runs |
| Chrome stops | `#fff → #cfd2d6 → #6a6d74 / #5a5d64` | Wordmark + U-glyph |
| Bezel stops | `#3a3a44 → #15151c → #000` | Tach outer ring |

### Typography
- **Inter Tight** 300/400/500/600/700/800 — display & UI text.
- **JetBrains Mono** 300/400/500/700 — labels, hex hashes, status ticker.
- Display title: 34px / 1.05 / -0.02em / 700.
- Body: 14px / 1.45 / 400.
- Micro-mono: 10px / 1 / 0.32–0.4em / 500.

### Spacing
4 / 8 / 12 / 16 / 18 / 24 / 32 / 48. Mobile viewport padding: 24.

### Radius
- Buttons: 14
- Form card: 18
- Inputs: 12
- Inner pills / chips: 999

### Glass surfaces (copy verbatim)
- `.ug-glass` — neutral chrome: `linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))` + `backdrop-filter: blur(28px) saturate(140%)` + 0.5px `rgba(255,255,255,0.14)` border + layered shadows (see `<style>` in `Mobile Boot.html`).
- `.ug-glass-tinted` — red tint: same recipe with an additional `rgba(255,42,42,0.10 → 0.03)` overlay and a `0 0 32px rgba(255,42,42,0.18)` outer glow.

### Animation
| Name | Duration | Easing | Purpose |
|---|---|---|---|
| `ugRotisserie` | 7s | `cubic-bezier(.45,.05,.55,.95)` infinite | UNDERGROUND wordmark Y-axis spin |
| `ugTachSweepDash` | 3.4s | linear infinite | Comet sweep around the tach |
| `ugShimmer` | 4.2s | ease-in-out infinite (1s delay) | Button highlight pass |
| `ugGlassRise` | 240ms | ease-out | Form card entrance |
| `ugCornersIn` | 600ms | ease-out | Corner crosshair settle |
| `ugStaticDip` | 1700ms | ease-in-out | Matrix-intro fade out |
| `ugStaticShift` | 110ms steps(2) | infinite | Static jitter |
| `ugStaticFlicker` | 900ms | ease-in-out infinite | Static brightness wobble |
| `ugBandSweep` | 700–1100ms | ease-out / ease-in | Scanline band traversal |

All keyframes are defined inline in `<style>` at the top of `Mobile Boot.html` — copy them verbatim.

## Assets
- **Fonts**: Google Fonts — Inter Tight + JetBrains Mono.
- **Static / noise**: inline SVG data URIs with `<feTurbulence>`. No raster images.
- **Icons**: none — all marks are SVG drawn inline.
- **Device frame**: `ios-frame.jsx` is included as a design-time visualization wrapper only. In production, do not ship the bezel — the app fills the actual device.

## Files
- `Mobile Boot.html` — single-file prototype containing all screens (boot → landing → form cards).
- `ios-frame.jsx` — design-time iPhone bezel wrapper (do not ship).

## Implementation Notes
- The prototype uses inline Babel + a single component tree. Split into discrete components in the target stack: `BootSequence`, `BootMonogram` (tach SVG), `Wordmark`, `Landing`, `FormCard`, `GlassButton`, `CrosshairCorners`, `GrainOverlay`.
- The tach SVG is computed (tick positions, arc endpoints). Keep that logic — don't hand-author the path d-strings.
- `backdrop-filter` performance: on Android Chrome, downgrade to a static frosted PNG fallback if the glass surfaces stutter during the boot.
- Test the boot at 60Hz vs 120Hz; the comet sweep should still look smooth at 60.
