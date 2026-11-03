/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve modern formats (AVIF first, then WebP) at responsive sizes; originals are never altered.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Product images come from Supabase Storage, but admins may also paste image URLs from other hosts.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      // local Supabase (`supabase start`)
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async redirects() {
    return [
      // The Vercel default domain duplicates the whole site — send it to the real domain
      {
        source: "/:path*",
        has: [{ type: "host", value: "homiqo.vercel.app" }],
        destination: "https://www.homiqoofficial.site/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
