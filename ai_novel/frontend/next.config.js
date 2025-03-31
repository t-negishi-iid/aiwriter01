/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // タイムアウト設定はfetchOptons経由で行う
  // experimental: {
  //   serverFetchTimeout: 30000, // 30秒
  // },

  // APIリクエストリライト
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
    console.log(`API proxy rewrites configured to: ${backendUrl}`);

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // 環境変数設定
  env: {
    NEXT_PUBLIC_API_DIRECT_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
    BACKEND_HOST: process.env.BACKEND_HOST || 'localhost',
    BACKEND_PORT: process.env.BACKEND_PORT || '8001',
    FETCH_TIMEOUT: '30000', // タイムアウト値を環境変数として設定
  },

  // ビルド設定
  webpack(config) {
    // Webpackの設定を最適化
    config.watchOptions = {
      ...config.watchOptions,
      poll: 1000, // Docker環境でのホットリロード用
      aggregateTimeout: 300,
    };
    return config;
  },
};

module.exports = nextConfig;
