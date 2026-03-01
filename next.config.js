/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { turbo: false },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.normies.art' },
    ],
  },
}
module.exports = nextConfig
