import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Product } from "./types";

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** Cache tag for the storefront catalog — revalidated when admins save products or orders change stock. */
export const PRODUCTS_TAG = "products";

const normalize = (p: Product): Product => ({
  ...p,
  price: Number(p.price),
  compare_at_price: p.compare_at_price == null ? null : Number(p.compare_at_price),
});

/**
 * The whole active catalog in one query, cached across requests (no cookies → cacheable).
 * The catalog is small, so filtering/sorting happens in memory.
 */
const getCatalog = unstable_cache(
  async (): Promise<Product[]> => {
    if (!supabaseConfigured) return [];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`getCatalog: ${error.message}`); // don't cache a failed read
    return ((data as Product[]) || []).map(normalize);
  },
  ["catalog-v1"],
  { tags: [PRODUCTS_TAG], revalidate: 300 },
);

export async function getProducts(opts: { featured?: boolean; category?: string; q?: string; sort?: string } = {}) {
  let list = await getCatalog().catch((e) => {
    console.error(e);
    return [] as Product[];
  });
  if (opts.featured) list = list.filter((p) => p.is_featured);
  if (opts.category) list = list.filter((p) => p.category === opts.category);
  const term = opts.q?.trim().toLowerCase();
  if (term) {
    list = list.filter((p) =>
      [p.name, p.short_description, p.category].some((s) => (s || "").toLowerCase().includes(term)),
    );
  }
  switch (opts.sort) {
    case "price-asc":
      return [...list].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...list].sort((a, b) => b.price - a.price);
    case "newest":
      return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    default:
      return list;
  }
}

export async function getProductBySlug(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getCategories() {
  return Array.from(new Set((await getProducts()).map((p) => p.category))).sort();
}
