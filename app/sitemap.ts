import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { STORE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = STORE.siteUrl;
  const pages: MetadataRoute.Sitemap = ["", "/shop", "/track", "/contact", "/policies"].map((p) => ({ url: base + p }));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return pages;
  const { data } = await createClient(url, key).from("products").select("slug,updated_at").eq("is_active", true);
  return [
    ...pages,
    ...(data || []).map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updated_at })),
  ];
}
