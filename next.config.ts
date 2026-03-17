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
    '/api/story-flow': ['./data/**/*'],
  },
  async headers() {
    return [
      {
        // public/images/ 配下の静的画像ファイルを毎回再検証させる
        // 同じファイル名で画像を差し替えたときにブラウザキャッシュに古い画像が残らないようにする
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
    ];
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
