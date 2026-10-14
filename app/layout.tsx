import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { STORE } from "@/lib/config";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(STORE.siteUrl),
  title: { default: `${STORE.name} — Kitchen & Home Essentials`, template: `%s | ${STORE.name}` },
  description: `${STORE.tagline}. Coffee makers, choppers, qeema makers, vacuum cleaners and more with Cash on Delivery.`,
  openGraph: { siteName: STORE.name, type: "website" },
};

export const viewport: Viewport = { themeColor: "#1b7d66", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
