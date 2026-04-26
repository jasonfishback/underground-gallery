// components/AdminBadge.tsx
//
// Displays an "ADMIN" pill next to a callsign. Used everywhere a moderator
// is shown so the founder/admin status is always visible at a glance.

import { colors, fonts } from '@/lib/design';

type Size = 'sm' | 'md' | 'lg';

export function AdminBadge({ size = 'md' }: { size?: Size } = {}) {
  const config: Record<Size, { fontSize: number; padding: string; letterSpacing: string }> = {
    sm: { fontSize: 7, padding: '1px 5px', letterSpacing: '0.2em' },
    md: { fontSize: 8, padding: '2px 6px', letterSpacing: '0.25em' },
    lg: { fontSize: 10, padding: '4px 10px', letterSpacing: '0.3em' },
  };
  const c = config[size];

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: c.fontSize,
        letterSpacing: c.letterSpacing,
        color: colors.accent,
        border: `0.5px solid ${colors.accent}`,
        padding: c.padding,
        fontFamily: fonts.mono,
        fontWeight: 700,
        verticalAlign: 'middle',
        background: colors.accentSoft,
      }}
    >
      ADMIN
    </span>
  );
}

/** Renders a callsign with an inline admin badge if applicable. */
export function CallsignWithBadge({
  callsign,
  isAdmin,
  size = 'md',
  prefix = '@',
  color,
}: {
  callsign: string | null;
  isAdmin: boolean;
  size?: Size;
  prefix?: string;
  color?: string;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: color ?? colors.text, fontWeight: 700 }}>
        {prefix}
        {callsign ?? '???'}
      </span>
      {isAdmin && <AdminBadge size={size} />}
    </span>
  );
}
