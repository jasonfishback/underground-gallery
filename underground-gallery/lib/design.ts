// lib/design.ts
//
// Design tokens shared across the app. Every component references these
// instead of hard-coded values so visual changes happen in one place.

export const colors = {
  // Backgrounds
  bg: '#0a0a0a',
  bgElevated: '#111',
  bgSubtle: '#0d0d0d',

  // Text
  text: '#fafafa',
  textMuted: '#888',
  textDim: '#555',

  // Brand red
  accent: '#ff3030',
  accentSoft: 'rgba(255,48,48,0.1)',
  accentBorder: '#ff3030',

  // Borders
  border: '#222',
  borderStrong: '#333',

  // Status
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#ff3030',
};

export const fonts = {
  sans: 'system-ui, -apple-system, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
};

export const styles = {
  panel: {
    background: colors.bgElevated,
    border: `0.5px solid ${colors.border}`,
    padding: 24,
  } as React.CSSProperties,

  input: {
    width: '100%',
    background: 'transparent',
    border: `0.5px solid ${colors.border}`,
    padding: '10px 12px',
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 13,
    outline: 'none',
  } as React.CSSProperties,

  label: {
    display: 'block',
    fontSize: 10,
    letterSpacing: '0.3em',
    color: colors.textMuted,
    marginBottom: 6,
    fontFamily: fonts.mono,
    fontWeight: 700,
  } as React.CSSProperties,

  buttonPrimary: {
    background: colors.accent,
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    fontSize: 12,
    letterSpacing: '0.3em',
    fontFamily: fonts.mono,
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,

  buttonGhost: {
    background: 'transparent',
    color: colors.text,
    border: `0.5px solid ${colors.border}`,
    padding: '12px 20px',
    fontSize: 12,
    letterSpacing: '0.3em',
    fontFamily: fonts.mono,
    fontWeight: 700,
    cursor: 'pointer',
  } as React.CSSProperties,
};
