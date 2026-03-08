import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // data/ ディレクトリをVercelサーバーレス関数のバンドルに明示的に含める
  // （動的パスはNext.jsの自動トレーシングで検出されないため必須）
  outputFileTracingIncludes: {
    '/api/criminal-response': ['./data/**/*'],
    '/api/judge': ['./data/**/*'],
    '/api/get-case': ['./data/**/*'],
    '/api/list-cases': ['./data/**/*'],
    '/api/save-session': ['./data/**/*'],
    '/api/get-session': ['./data/**/*'],
  },
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
