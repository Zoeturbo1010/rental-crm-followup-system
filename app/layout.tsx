import type { Metadata } from "next";
import "./globals.css";
import "./schedule.css";
import "./chrome-polish.css";
import "./overlay-layout.css";

export const metadata: Metadata = {
  title: "客户跟进系统",
  applicationName: "客户跟进系统",
  description: "现代化租房平台客户关系与成交管理系统。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
