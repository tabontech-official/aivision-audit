import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AI Vision Audit — SEO & AI Search Visibility Platform",
    template: "%s · AI Vision Audit",
  },
  description:
    "Audit your store and website in minutes: technical SEO core, crawlability, indexability, speed, schema, AI discoverability, and recommendations with actionable fixes.",
};

import { NavigationProgressBar } from "@/components/ui/navigation-progress-bar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        <NavigationProgressBar />
        {children}
      </body>
    </html>
  );
}
