/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // WebP at responsive sizes: much faster to generate on first request than AVIF (better LCP), originals untouched.
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Product images come from Supabase Storage, but admins may also paste image URLs from other hosts.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      // local Supabase (`supabase start`)
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async headers() {
    // Product photos, videos and logos in /public are versioned by filename — let browsers & the CDN cache them
    const longCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    return [
      { source: "/products/:path*", headers: longCache },
      { source: "/videos/:path*", headers: longCache },
      { source: "/:file(logo[^/]*\\.png)", headers: longCache },
    ];
  },
  async redirects() {
    return [
      // Short links for ads / social / WhatsApp (query strings such as UTM tags are passed through)
      { source: "/coffee-beater", destination: "/product/electric-milk-frother-egg-beater", permanent: false },
      { source: "/combo", destination: "/product/knife-sharpener-faucet-sink-rack-combo", permanent: false },
      // Health products removed (Meta blocks pixel data for health-related sites)
      { source: "/category/health-care", destination: "/shop", permanent: false },
      { source: "/product/portable-mesh-nebulizer", destination: "/shop", permanent: false },
      // The Vercel default domain and the old homiqo.site domain duplicate the site — 301 them to the real domain
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>homiqo\\.vercel\\.app|homiqo\\.site|www\\.homiqo\\.site)" }],
        destination: "https://www.homiqoofficial.site/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
