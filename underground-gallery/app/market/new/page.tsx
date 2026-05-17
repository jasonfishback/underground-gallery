// app/market/new/page.tsx — picker between car / part listing.

import Link from 'next/link';
import { colors, fonts } from '@/lib/design';

export const metadata = { title: 'List something' };

export default function NewListingPicker() {
  return (
    <main
      style={{
        padding: '48px 24px',
        maxWidth: 720,
        margin: '0 auto',
        color: colors.text,
        fontFamily: fonts.sans,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: colors.accent,
          fontFamily: fonts.mono,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        ∕∕ UNDERGROUND · MARKET
      </div>
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>What are you selling?</h1>
      <p style={{ color: colors.textMuted, marginBottom: 28 }}>
        Listings are visible only to approved members.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <PickerCard
          href="/market/new/car"
          title="A whole car"
          body="The car itself. Daily, project, race build, parts car — all welcome."
        />
        <PickerCard
          href="/market/new/part"
          title="A part or piece"
          body="Anything from turbos to seats to a single coilover. Fitment matters."
        />
      </div>
    </main>
  );
}

function PickerCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="ug-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        textDecoration: 'none',
        color: 'inherit',
        gap: 8,
      }}
    >
      <h2 style={{ fontSize: 22, margin: 0, color: colors.text }}>{title}</h2>
      <p style={{ fontSize: 14, color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
        {body}
      </p>
    </Link>
  );
}
