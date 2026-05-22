/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose', 'nodemailer'],
  devIndicators: false,

  // ── Performance optimizations ──────────────────────────────
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
    formats: ['image/webp', 'image/avif'], // serve webp/avif for faster loading
    minimumCacheTTL: 60 * 60 * 24 * 30,   // cache images 30 days
  },

  // HTTP cache headers for static assets
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|ico|svg|webp)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    optimizePackageImports: ['react-icons', 'lucide-react'],
  },
};

module.exports = nextConfig;
