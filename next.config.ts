import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // GitHub Pages 子路径（本地开发时留空，部署时自动使用 /chair-picker）
  basePath: process.env.GITHUB_PAGES === "true" ? "/chair-picker" : "",
};

export default nextConfig;
