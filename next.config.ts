import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma + argon2 native bindings must stay external to the server bundle
  serverExternalPackages: ["@node-rs/argon2", "@prisma/client"],
  poweredByHeader: false,
  // The dev-only indicator defaults to bottom-left, where it covers the
  // sidebar's account footer (and its log-out control) on every dashboard.
  devIndicators: { position: "bottom-right" },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
