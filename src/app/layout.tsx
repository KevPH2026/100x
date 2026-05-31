import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IdeaLab - AI 灵感创作平台",
  description: "AI灵感创作平台，创意文案与图片一站式生成",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><defs><linearGradient id='g' x1='24' y1='4' x2='24' y2='44' gradientUnits='userSpaceOnUse'><stop offset='0%25' stop-color='%23a855f7'/><stop offset='100%25' stop-color='%236366f1'/></linearGradient></defs><path d='M24 4C17.37 4 12 9.37 12 16C12 19.87 14.06 23.27 17.2 25.4C17.75 25.78 18 26.4 18 27.1V30H30V27.1C30 26.4 30.25 25.78 30.8 25.4C33.95 23.27 36 19.87 36 16C36 9.37 30.63 4 24 4Z' fill='url(%23g)'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
