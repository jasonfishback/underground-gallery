// app/market/new/page.tsx — picker between car / part listing.

import Link from 'next/link';

export const metadata = { title: 'List something' };

export default function NewListingPicker() {
  return (
    <main
      style={{
        padding: '48px 24px',
        maxWidth: 720,
        margin: '0 auto',
        color: '#fff',
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.4em',
          color: '#ff3030',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        UNDERGROUND · MARKET
      </div>
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>What are you selling?</h1>
      <p style={{ color: 'rgba(245,246,247,0.6)', marginBottom: 28 }}>
        Listings are visible only to approved members.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <PickerCard
          href="/market/new/car"
          title="A whole car"
          body="The car itself. Daily, project, race build, parts car — all welcome."
          accent="#ff3030"
        />
        <PickerCard
          href="/market/new/part"
          title="A part or piece"
          body="Anything from turbos to seats to a single coilover. Fitment matters."
          accent="#ff8585"
        />
      </div>
    </main>
  );
}

function PickerCard({
  href,
  title,
  body,
  accent,
}: {
  href: string;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        borderRadius: 14,
        background: 'rgba(20,22,30,0.55)',
        border: `1px solid ${accent}40`,
        textDecoration: 'none',
        color: 'inherit',
        gap: 8,
      }}
    >
      <h2 style={{ fontSize: 22, margin: 0, color: '#fff' }}>{title}</h2>
      <p style={{ fontSize: 14, color: 'rgba(245,246,247,0.65)', margin: 0, lineHeight: 1.5 }}>
        {body}
      </p>
    </Link>
  );
}
