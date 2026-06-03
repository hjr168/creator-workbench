import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "个人IP内容工作台",
  description: "本地优先的交互式内容生产编排台",
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
