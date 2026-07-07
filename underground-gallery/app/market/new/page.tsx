// app/market/new/page.tsx — FB-Marketplace style quick list: one screen,
// photos first, post in one click. Full car/part editors linked below.

import { QuickListForm } from '@/components/market/QuickListForm';
import { colors, fonts } from '@/lib/design';

export const metadata = { title: 'List something' };

export default function NewListingPage() {
  return (
    <main
      style={{
        padding: '48px 24px 80px',
        maxWidth: 640,
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
      <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>Sell something</h1>
      <p style={{ color: colors.textMuted, marginBottom: 24 }}>
        Photos, price, post. Visible only to approved members.
      </p>
      <QuickListForm />
    </main>
  );
}
