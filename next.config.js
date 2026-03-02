/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack: faster builds (Pro enhanced build machines make this even quicker)
  experimental: { turbo: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.normies.art' },
    ],
  },

  // Security + performance headers — takes advantage of Pro's WAF layer
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache static assets aggressively on CDN
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
