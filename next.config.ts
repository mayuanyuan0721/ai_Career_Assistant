import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer", "cheerio", "pdf-parse", "mammoth"],
  
  // ⚡ 性能优化配置
  
  // 1. 启用响应压缩
  compress: true,
  
  // 2. 禁用不必要的调试信息（生产环境自动生效）
  poweredByHeader: false,
  
  // 3. 增强静态资源缓存
  generateEtags: true,
  
  // 4. 减少渲染次数（React Strict Mode 在开发环境会有双重渲染，生产环境不受影响）
  reactStrictMode: true,
};

export default nextConfig;
