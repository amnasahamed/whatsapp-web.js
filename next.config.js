/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error handling
  reactStrictMode: true,

  // Enable SWC minification for faster builds
  swcMinify: true,

  // Experimental features
  experimental: {
    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for packages that depend on fs module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Add custom webpack rules if needed
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    return config;
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ];
  },

  // Environment variables available to the client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.APP_URL || 'http://localhost:3000',
  },

  // TypeScript configuration
  typescript: {
    // Disable type checking during production builds
    // We run type checking in CI/CD
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Disable ESLint during production builds
    // We run ESLint in CI/CD
    ignoreDuringBuilds: false,
  },

  // Output configuration
  output: 'standalone',

  // Compression
  compress: true,

  // Power the process by limiting memory
  poweredByHeader: false,
};

module.exports = nextConfig;
