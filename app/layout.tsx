import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { STORE } from "@/lib/config";
import { KEYWORDS, ld, siteJsonLd } from "@/lib/seo";

const sans = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sans", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(STORE.siteUrl),
  title: { default: `${STORE.name} — Kitchen Gadgets & Home Essentials in Pakistan`, template: `%s | ${STORE.name}` },
  description: `Shop kitchen gadgets online in Pakistan — vegetable choppers, electric choppers, coffee beaters, sink organizers & handheld vacuums. Cash on delivery nationwide.`,
  keywords: KEYWORDS,
  applicationName: STORE.name,
  openGraph: {
    siteName: STORE.name,
    type: "website",
    locale: "en_PK",
    images: [{ url: "/logo-stacked.png", alt: STORE.name }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: { "facebook-domain-verification": "ghbmn09si9dmc93dlv17xl3oixif0e" },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#0E2A28", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={ld(siteJsonLd())} />
        {children}
      </body>
    </html>
  );
}
