/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product images come from Supabase Storage, but admins may also paste image URLs from other hosts.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      // local Supabase (`supabase start`)
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
