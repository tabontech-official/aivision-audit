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
    default: "AuditFlow — Free Shopify Store Audit",
    template: "%s · AuditFlow",
  },
  description:
    "Audit your Shopify store in minutes: app bloat, theme performance, product schema, SEO and AI readiness — with fixes that name the exact Shopify setting or theme file to change.",
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
