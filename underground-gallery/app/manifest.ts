import type { MetadataRoute } from 'next';

// PWA manifest — makes Underground Gallery installable to the home screen on
// iOS/Android and desktop. Next auto-injects <link rel="manifest"> from this.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Underground Gallery',
    short_name: 'Underground',
    description: 'Members-only garage, build log, race sim, and marketplace. Invite only.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#05060a',
    theme_color: '#05060a',
    categories: ['lifestyle', 'social', 'automotive'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
