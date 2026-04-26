/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Root → desktop landing (gated access screen)
      { source: '/', destination: '/landing.html' },

      // Invite share links — keep this; it's a real flow that hands a code to invite-share.html
      { source: '/invite/:slug', destination: '/invite-share.html' },

      // ─── REMOVED rewrites — these were hijacking real Next.js routes ───
      // /m, /share, /garage, /moderator, /flow, /mobile-boot were all pointing at
      // demo HTML files in public/. Those demos are deleted now and these routes
      // are either real Next.js pages (/garage) or unused.
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