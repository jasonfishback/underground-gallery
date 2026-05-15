import type { Metadata } from 'next';
import Link from 'next/link';
import { colors, fonts } from '@/lib/design';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function Terms() {
  return (
    <main style={{ minHeight: '100vh', background: colors.bg, color: colors.textMuted, fontFamily: fonts.sans, padding: '40px 24px 80px' }}>
      <header style={{ maxWidth: 720, margin: '0 auto 48px', paddingBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
        <Link href="/" style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.3em', textDecoration: 'none', color: colors.text, fontWeight: 700 }}>
          ∕∕ UNDERGROUND&nbsp;GALLERY
        </Link>
      </header>

      <article style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.7, fontSize: 15 }}>
        <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.accent, letterSpacing: '0.3em', fontWeight: 700, margin: '0 0 16px' }}>∕∕ TERMS OF SERVICE</p>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: colors.text, letterSpacing: '-0.02em', margin: '0 0 12px' }}>Terms of Service</h1>
        <p style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 24px' }}>Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <h2 style={h2}>1. The deal</h2>
        <p>By using Underground Gallery, you agree to these terms. If you do not agree, do not use the site. Membership is a privilege we extend by invitation, and we can revoke it at any time, for any reason.</p>

        <h2 style={h2}>2. Applications</h2>
        <p>Anyone can apply. We accept who we want, when we want. Applying does not guarantee membership. We may deny or remove applications for any reason, including but not limited to: fake information, spam, abusive behavior, or because we feel like it.</p>

        <h2 style={h2}>3. Member conduct</h2>
        <p>If you become a member, you agree not to: harass other members, share private content posted by other members outside the platform, attempt to circumvent moderation, use the platform for illegal activity, or post stolen content.</p>

        <h2 style={h2}>4. Content you post</h2>
        <p>You retain ownership of anything you post. By posting, you give us a non-exclusive license to display it on the platform. We can remove content at our sole discretion. Don't post anything you don't have the right to post.</p>

        <h2 style={h2}>5. Termination</h2>
        <p>We can suspend or remove your access at any time, for any reason. You can leave whenever you want — email <a style={link} href="mailto:info@undergroundgallery.ai">info@undergroundgallery.ai</a>.</p>

        <h2 style={h2}>6. No warranties</h2>
        <p>The site is provided "as is." We make no guarantees that it will be available, error-free, or fit for any particular purpose. Use at your own risk.</p>

        <h2 style={h2}>7. Limitation of liability</h2>
        <p>To the fullest extent allowed by law, Underground Gallery and its operators are not liable for any indirect, incidental, or consequential damages arising from your use of the site.</p>

        <h2 style={h2}>8. Changes</h2>
        <p>We may update these terms. The "last updated" date at the top reflects the most recent revision. Continued use after changes means you accept them.</p>

        <h2 style={h2}>9. Contact</h2>
        <p>Underground Gallery<br/>
        <a style={link} href="mailto:info@undergroundgallery.ai">info@undergroundgallery.ai</a></p>
      </article>

      <footer style={{ maxWidth: 720, margin: '64px auto 0', paddingTop: 32, borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 24, flexWrap: 'wrap', fontFamily: fonts.mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        <Link href="/privacy" style={{ color: colors.textMuted, textDecoration: 'none' }}>Privacy</Link>
        <Link href="/terms" style={{ color: colors.textMuted, textDecoration: 'none' }}>Terms</Link>
        <a href="mailto:info@undergroundgallery.ai" style={{ color: colors.textMuted, textDecoration: 'none' }}>Contact</a>
      </footer>
    </main>
  );
}

const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: colors.text, letterSpacing: '-0.01em', margin: '32px 0 12px' };
const link: React.CSSProperties = { color: colors.accent, textDecoration: 'underline' };
