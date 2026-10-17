import type { Metadata } from "next";
import "./flow.css";

export const metadata: Metadata = {
  title: "客户跟进系统",
  applicationName: "客户跟进系统",
  description: "租赁业务客户跟进作品集：客户档案、沟通记录、房源推荐、预约带看、回访与成交结算完整联动，提供浏览器本地交互演示。",
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
