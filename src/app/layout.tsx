import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";

export const metadata: Metadata = {
  title: "cHinL Workspace — AI-Powered Platform",
  description: "整合 AI 驅動的專業工具平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
