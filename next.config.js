const { withSentryConfig } = require('@sentry/nextjs')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Content Security Policy
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.walletconnect.com https://*.walletconnect.org https://accounts.google.com https://apis.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com;
  img-src 'self' data: blob: https: http:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://rpc.walletconnect.com https://verify.walletconnect.com https://api.web3modal.com https://pulse.walletconnect.org https://*.infura.io https://*.alchemy.com https://cloudflare-eth.com https://mainnet.base.org https://arb1.arbitrum.io https://api.coingecko.com https://api.llama.fi https://vercel.live https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://*.kakao.com https://kauth.kakao.com https://kapi.kakao.com https://*.sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com;
  frame-src 'self' https://verify.walletconnect.com https://vercel.live https://accounts.google.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accounts.google.com https://kauth.kakao.com;
  frame-ancestors 'self';
  upgrade-insecure-requests;
`.replace(/\n/g, ' ').trim()

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,               // Enable gzip compression
  poweredByHeader: false,       // Remove X-Powered-By header

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ignore unused wagmi connector dependencies
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      '@base-org/account': false,
      '@gemini-wallet/core': false,
      'porto/internal': false,
      'porto': false,
      '@safe-global/safe-apps-sdk': false,
      '@safe-global/safe-apps-provider': false,
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net', // Kakao OAuth avatars
      },
      {
        protocol: 'https',
        hostname: 't1.kakaocdn.net', // Kakao OAuth avatars (alternate)
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub OAuth avatars
      },
    ],
  },
  // Redirects
  async redirects() {
    return [
      // /careers -> /jobs (alias)
      { source: '/careers', destination: '/jobs', permanent: true },
      { source: '/ko/careers', destination: '/ko/jobs', permanent: true },
    ]
  },
  // i18n rewrites - map /ko/* to /* (same pages, different locale)
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite /ko to /
        { source: '/ko', destination: '/' },
        // Rewrite /ko/anything to /anything
        { source: '/ko/:path*', destination: '/:path*' },
      ],
    }
  },
  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
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
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy,
          },
        ],
      },
      {
        // API routes - restrict CORS
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_SITE_URL || 'https://neun.wtf',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ]
  },
}

// Sentry config options
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  hideSourceMaps: true,
}

module.exports = withSentryConfig(
  withBundleAnalyzer(nextConfig),
  sentryWebpackPluginOptions
)
