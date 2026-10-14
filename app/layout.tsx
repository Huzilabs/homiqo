import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { STORE } from "@/lib/config";

const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(STORE.siteUrl),
  title: { default: `${STORE.name} — Smart Kitchen & Home Essentials`, template: `%s | ${STORE.name}` },
  description: `${STORE.tagline}. Qeema makers, choppers, coffee makers, cordless vacuums and more with Cash on Delivery across Pakistan.`,
  openGraph: { siteName: STORE.name, type: "website", images: ["/logo-stacked.png"] },
};

export const viewport: Viewport = { themeColor: "#0D5B58", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
