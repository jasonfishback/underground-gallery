// lib/mod-preview/presets.ts
//
// The catalog of visual mods the preview tool can apply. Each preset is just
// an instruction describing the change — the edit layer wraps it with the
// "keep the rest of the car identical" guardrails. `prefersReference` hints
// the router toward the provider that's best at multi-image conditioning
// (Google Nano Banana) once we add a real wheel-image catalog.

export type ModPreviewCategory = 'Wheels' | 'Stance' | 'Carbon' | 'Finish';

export type ModPreset = {
  id: string;
  category: ModPreviewCategory;
  label: string;
  /** short emoji/marker for the tile */
  glyph: string;
  /** the specific change, phrased as an imperative edit instruction */
  change: string;
  /** true once this preset should be conditioned on a reference image */
  prefersReference?: boolean;
};

export const MOD_PRESETS: ModPreset[] = [
  // ── Wheels ──────────────────────────────────────────────────────────────
  {
    id: 'wheels_bronze_3p',
    category: 'Wheels',
    label: 'Bronze 3-piece forged',
    glyph: '🥉',
    change:
      'replace the wheels with bronze multi-spoke 3-piece forged wheels with a polished outer lip and an aggressive, flush fitment',
  },
  {
    id: 'wheels_black_concave',
    category: 'Wheels',
    label: 'Gloss black concave',
    glyph: '⚫',
    change:
      'replace the wheels with deep-concave gloss black split-spoke performance wheels with a flush fitment',
  },
  {
    id: 'wheels_gold_mesh',
    category: 'Wheels',
    label: 'Gold classic mesh',
    glyph: '🟡',
    change:
      'replace the wheels with classic gold fine-mesh wheels (BBS/Volk style) with a tucked fitment',
  },
  {
    id: 'wheels_silver_split',
    category: 'Wheels',
    label: 'Hyper-silver split spoke',
    glyph: '⚪',
    change:
      'replace the wheels with hyper-silver split-spoke motorsport wheels with a subtle lip',
  },

  // ── Stance / suspension ─────────────────────────────────────────────────
  {
    id: 'drop_mild',
    category: 'Stance',
    label: 'Coilover drop',
    glyph: '↓',
    change:
      'lower the ride height moderately as if on coilovers (about 1.5 inch drop), reducing the gap between the tires and the fenders, keeping the same wheels and tires',
  },
  {
    id: 'drop_slammed',
    category: 'Stance',
    label: 'Slammed stance',
    glyph: '⬇',
    change:
      'give the car an aggressive slammed static stance sitting very low over the wheels with a minimal fender gap and slight negative camber, keeping the same wheels and tires',
  },

  // ── Carbon fiber ────────────────────────────────────────────────────────
  {
    id: 'carbon_hood',
    category: 'Carbon',
    label: 'Carbon hood',
    glyph: '🏁',
    change:
      'change only the hood to exposed carbon fiber with a visible twill weave and a clear-coat sheen',
  },
  {
    id: 'carbon_kit',
    category: 'Carbon',
    label: 'Carbon aero kit',
    glyph: '🖤',
    change:
      'add an exposed carbon fiber front lip splitter, side skirts, and rear diffuser with a visible twill weave',
  },
  {
    id: 'carbon_roof',
    category: 'Carbon',
    label: 'Carbon roof',
    glyph: '▦',
    change: 'change only the roof panel to exposed carbon fiber with a visible twill weave',
  },

  // ── Finish ──────────────────────────────────────────────────────────────
  {
    id: 'tint_windows',
    category: 'Finish',
    label: 'Blacked-out tint',
    glyph: '🕶',
    change:
      'darken the window tint to a limo/blacked-out level and black out the window trim, keeping the body paint the same',
  },
];

export function getPreset(id: string): ModPreset | undefined {
  return MOD_PRESETS.find((p) => p.id === id);
}
