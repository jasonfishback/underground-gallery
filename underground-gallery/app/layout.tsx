import { getAuthContext } from '@/lib/auth/gates';
import { getRecentNotifications } from '@/lib/notifications/fetch';
import { NotificationBell } from '@/components/NotificationBell';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://undergroundgallery.ai'),
  title: {
    default: 'Underground Gallery',
    template: '%s · Underground Gallery',
  },
  description: 'A members-only gallery for the work most people never see. Invite only. Est. MMXXVI.',
  applicationName: 'Underground Gallery',
  keywords: ['underground gallery', 'invite only', 'members only', 'car culture', 'private gallery'],
  authors: [{ name: 'Underground Gallery' }],
  openGraph: {
    title: 'Underground Gallery',
    description: 'A members-only gallery for the work most people never see. Invite only.',
    url: 'https://undergroundgallery.ai',
    siteName: 'Underground Gallery',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Underground Gallery' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Underground Gallery',
    description: 'A members-only gallery. Invite only.',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}