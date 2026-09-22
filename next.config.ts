import type { NextConfig } from "next";

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  console.error(
    "Fatal Error: NEXT_PUBLIC_SITE_URL environment variable is required.",
  );
  process.exit(0);
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://checkout.razorpay.com https://cdn.razorpay.com https://api.razorpay.com",
      "frame-src 'self' https://challenges.cloudflare.com https://www.google.com https://maps.google.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: https://*.razorpay.com",
      "media-src 'self' blob: data: https:",
      "font-src 'self' https://checkout-static-next.razorpay.com https://*.razorpay.com https://fonts.gstatic.com data:",
      "connect-src 'self' https://accounts.google.com https://challenges.cloudflare.com https://www.google.com https://maps.googleapis.com https://api.postalpincode.in https://api.razorpay.com https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com https://*.razorpay.com https://*.px-cloud.net https://*.px-cdn.net https://*.pxchk.net ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
