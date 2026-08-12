import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // 确保静态导出时客户端路由正常工作
  trailingSlash: true,
};

export default nextConfig;
