/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      // Root → desktop landing
      { source: '/', destination: '/landing.html' },

      // Device-routed mobile experience
      { source: '/m', destination: '/mobile.html' },

      // Member experiences
      { source: '/invite/:slug', destination: '/invite-share.html' },
      { source: '/share', destination: '/share.html' },
      { source: '/garage', destination: '/invite.html' },
      { source: '/moderator', destination: '/moderator.html' },

      // Internal preview tools (noindex'd)
      { source: '/flow', destination: '/flow.html' },
      { source: '/mobile-boot', destination: '/mobile-boot.html' },
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
