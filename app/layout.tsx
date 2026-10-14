import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { STORE } from "@/lib/config";

const sans = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sans", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(STORE.siteUrl),
  title: { default: `${STORE.name} — Smart Kitchen & Home Essentials`, template: `%s | ${STORE.name}` },
  description: `${STORE.tagline}. Qeema makers, choppers, coffee makers, cordless vacuums and more with Cash on Delivery across Pakistan.`,
  openGraph: { siteName: STORE.name, type: "website", images: ["/logo-stacked.png"] },
};

export const viewport: Viewport = { themeColor: "#0E2A28", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
