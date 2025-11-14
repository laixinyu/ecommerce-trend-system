import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    // 构建时忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
