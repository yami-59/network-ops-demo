/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // 只在服务端生效（next dev / next start）
    const backend = process.env.BACKEND_URL;

    if (!backend) {
      console.warn("⚠️ BACKEND_URL is not set. /api will not be proxied.");
      return [];
    }

    return [
      {
        source: "/api/:path*", destination: `${backend}/:path*`,
      },
      // 如果你后端没有 /api 前缀，就用这一条：
      // { source: "/api/:path*", destination: `${backend}/:path*` },
    ];
  },
};

module.exports = nextConfig;
