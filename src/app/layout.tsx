import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "アルメイダ 書類作成",
  description: "スタッフ管理のための書類作成アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
