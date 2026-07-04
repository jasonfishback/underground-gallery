// lib/design.ts
//
// Design tokens shared across the app. Every component references these
// instead of hard-coded values so visual changes happen in one place.
//
// Tokens mirror the CSS custom properties in app/globals.css (the iOS-frosted
// `--ug-*` system). Keep them in sync.

export const colors = {
  // Backgrounds — dark, but a cool gunmetal charcoal rather than flat black,
  // with elevated surfaces that read clearly above the base for real depth.
  bg: '#0c0e13',
  bgElevated: '#181c25',
  bgSubtle: '#101319',

  // Gunmetal surfaces (elevated cards / toolbars)
  surface: '#1a1f28',
  surfaceHi: '#20252f',

  // Text
  text: '#f5f6f7',
  textMuted: 'rgba(233,237,243,0.64)',
  textDim: 'rgba(233,237,243,0.40)',

  // Brand red
  accent: '#ff2a2a',
  accentSoft: 'rgba(255,42,42,0.18)',
  accentBorder: 'rgba(255,80,80,0.45)',

  // Borders — cool steel instead of pure white alpha
  border: 'rgba(168,180,199,0.14)',
  borderStrong: 'rgba(178,190,209,0.24)',

  // Status
  success: 'rgb(120,220,150)',
  warning: '#fbbf24',
  danger: '#ff2a2a',
};

export const fonts = {
  sans: "'Inter Tight', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
};

// Frosted-glass card surface (mirrors .ug-card in globals.css). Use for inline
// styles where adding a className isn't convenient.
const glassCardSurface: React.CSSProperties = {
  background:
    'linear-gradient(180deg, #1c212b 0%, #14181f 100%)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)' as any,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  boxShadow:
    '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
};

export const styles = {
  panel: {
    ...glassCardSurface,
    padding: 24,
  } as React.CSSProperties,

  card: {
    ...glassCardSurface,
  } as React.CSSProperties,

  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: '12px 14px',
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 14,
    outline: 'none',
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 8,
    fontFamily: fonts.mono,
    fontWeight: 600,
  } as React.CSSProperties,

  buttonPrimary: {
    background: 'linear-gradient(180deg, #ff3a3a 0%, #e01818 100%)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    padding: '12px 22px',
    fontSize: 12,
    letterSpacing: '0.18em',
    fontFamily: fonts.sans,
    fontWeight: 700,
    cursor: 'pointer',
    textTransform: 'uppercase',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 18px rgba(255,42,42,0.28), 0 1px 2px rgba(0,0,0,0.45)',
  } as React.CSSProperties,

  buttonGhost: {
    background: 'rgba(255,255,255,0.04)',
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: '12px 20px',
    fontSize: 12,
    letterSpacing: '0.18em',
    fontFamily: fonts.sans,
    fontWeight: 600,
    cursor: 'pointer',
    textTransform: 'uppercase',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)' as any,
  } as React.CSSProperties,
};
