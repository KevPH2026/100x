import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // 让 @imgly/background-removal 正确在客户端打包
    },
  },
  serverExternalPackages: [],
};

export default nextConfig;
