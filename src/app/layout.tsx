import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "今日可写",
  description: "面向公众号创作者的 AI 选题雷达",
  icons: {
    icon: "/favicon.svg",
  },
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
