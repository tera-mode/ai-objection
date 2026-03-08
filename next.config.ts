import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    if (!authDomain) return [];
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${authDomain}/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
