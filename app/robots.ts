import type { MetadataRoute } from "next";
import { STORE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const site = STORE.siteUrl.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/checkout", "/cart", "/order/", "/shop?q=", "/*sort="] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
