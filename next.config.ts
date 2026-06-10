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
    // In production, Next.js already appends content hashes to /_next/static/ chunk
    // URLs (e.g. page-ab12cd34.js). Immutable caching is safe because a changed file
    // gets a new URL. In development, chunk URLs have NO hash — the same URL is
    // reused after every recompile. Applying immutable here in dev causes the browser
    // to permanently cache the first version it downloads and ignore all subsequent
    // recompiles, producing server/client hydration mismatches on every code change.
    // Next.js sets the correct immutable headers for its own hashed assets internally;
    // this rule is only needed for /images/ which uses stable (non-hashed) paths.
    const isProd = process.env.NODE_ENV === "production";
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
      // Only applied in production where content-hashed URLs make immutable safe.
      ...(isProd ? [{
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      }] : []),
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
    // Tree-shake large icon/chart packages: only imported symbols are bundled.
    // NOTE: lucide-react is hardcoded by Next.js 16 in this list regardless of
    // user config (node_modules/next/dist/server/config.js:988). The listing
    // here for recharts/date-fns is intentional. Turbopack + lucide-react has a
    // known HMR factory-ordering race condition:
    //   check.mjs[no directive] → createLucideIcon.mjs[no directive] → Icon.mjs["use client"]
    // Turbopack registers Icon.mjs in a separate async chunk (node_modules client
    // boundary). check.mjs calls createLucideIcon() at module-eval time, before
    // Icon.mjs's factory is registered → "Module factory is not available".
    // No app-side fix exists: adding "use client" to createLucideIcon.mjs breaks
    // SSR (factory called on server). dev is therefore pinned to --webpack.
    // Re-test with `npm run dev:turbo` after lucide-react or Next.js updates.
    optimizePackageImports: [
      "recharts",
      "@radix-ui/react-icons",
      "date-fns",
    ],
    // Inline small CSS files (< 10 kB) to eliminate a render-blocking request.
    inlineCss: true,
  },
};

export default nextConfig;
