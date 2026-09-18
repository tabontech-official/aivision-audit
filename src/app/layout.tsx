import type { Metadata } from "next";
import { Inter, Familjen_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-familjen",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AuditFlow — Free Shopify Store Audit",
    template: "%s · AuditFlow",
  },
  description:
    "Audit your Shopify store in minutes: app bloat, theme performance, product schema, SEO and AI readiness — with fixes that name the exact Shopify setting or theme file to change.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${familjenGrotesk.variable}`}>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
