import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "cHinL Workspace",
  description: "AI-Powered Workspace - 整合 AI 驅動的專業工具平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
