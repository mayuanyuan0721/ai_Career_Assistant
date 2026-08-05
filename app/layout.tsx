import type { Metadata } from "next";
import "./globals.css";
import { installSupabaseErrorFilter } from "@/lib/supabase/error-filter";

// 安装 Supabase 错误过滤器（抑制重复的认证错误日志）
if (typeof window === "undefined") {
    installSupabaseErrorFilter();
}

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "DeepSeek AI Chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}