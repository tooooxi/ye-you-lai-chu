import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 本机用 localhost 或 127.0.0.1 打开时，开发资源不要被拦下。
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
