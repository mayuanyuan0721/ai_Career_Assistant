import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer", "cheerio", "pdf-parse", "mammoth"],
};

export default nextConfig;
