/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // The existing landing pages are static HTML in /public — we serve them via
  // rewrites so the URL stays clean (e.g. `/` → /public/landing.html).
  // Keeping the rebrand visually pixel-identical was the constraint, so we
  // didn't port them to React components.
  async rewrites() {
    return [
      // Root → desktop landing
      { source: '/', destination: '/landing.html' },

      // Device-routed mobile experience (set by middleware)
      { source: '/m', destination: '/mobile.html' },

      // Member experiences
      { source: '/invite/:slug', destination: '/invite-share.html' },
      { source: '/share', destination: '/share.html' },
      { source: '/garage', destination: '/invite.html' },
      { source: '/moderator', destination: '/moderator.html' },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
