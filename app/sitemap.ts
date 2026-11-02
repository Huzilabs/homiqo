import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";
import { abs } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const latest = products.reduce((d, p) => (p.updated_at > d ? p.updated_at : d), "1970-01-01");
  const categories = Array.from(new Set(products.map((p) => p.category)));
  return [
    { url: abs("/"), lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: abs("/shop"), lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: abs(`/shop?category=${encodeURIComponent(c)}`), lastModified: latest, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({
      url: abs(`/product/${p.slug}`),
      lastModified: p.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images.map(abs),
    })),
    { url: abs("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: abs("/policies"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
