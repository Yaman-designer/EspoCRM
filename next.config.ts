import type { NextConfig } from "next";

// All EspoCRM API calls are proxied through /api/espo — connect-src only needs 'self'.
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy",   value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Aggressive caching for static assets — Vercel honours these on edge.
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // 7-day CDN cache for optimised images (up from 1 h).
    minimumCacheTTL: 604800,
    // Prevent layout shift by enforcing known dimensions.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Cache Components: static shell + dynamic islands for instant TTFB.
  cacheComponents: true,

  experimental: {
    // Tree-shake large icon/chart packages so only the symbols actually
    // imported end up in the bundle. optimizePackageImports rewrites barrel
    // imports to direct file paths, bypassing the barrel entirely — it does
    // NOT re-introduce it. lucide-react must be here to prevent Turbopack from
    // pulling every icon (including unused ones like car.mjs) into the dev
    // module graph via the `import * as index from './icons/index.mjs'` in
    // lucide-react.mjs, which causes "module factory is not available" errors.
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-icons",
      "date-fns",
    ],
    // Inline small CSS files (< 10 kB) to eliminate a render-blocking request.
    inlineCss: true,
  },
};

export default nextConfig;
