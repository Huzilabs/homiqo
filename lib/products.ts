import { createClient, supabaseConfigured } from "./supabase/server";
import type { Product } from "./types";

const normalize = (p: Product): Product => ({
  ...p,
  price: Number(p.price),
  compare_at_price: p.compare_at_price == null ? null : Number(p.compare_at_price),
});

export async function getProducts(opts: { featured?: boolean; category?: string; q?: string; sort?: string } = {}) {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  let query = supabase.from("products").select("*").eq("is_active", true);
  if (opts.featured) query = query.eq("is_featured", true);
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.q) {
    const term = opts.q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,short_description.ilike.%${term}%,category.ilike.%${term}%`);
  }
  switch (opts.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("sort_order").order("created_at", { ascending: false });
  }
  const { data, error } = await query;
  if (error) console.error("getProducts", error.message);
  return ((data as Product[]) || []).map(normalize);
}

export async function getProductBySlug(slug: string) {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  return data ? normalize(data as Product) : null;
}

export async function getCategories() {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("category").eq("is_active", true);
  return Array.from(new Set((data || []).map((r: { category: string }) => r.category))).sort();
}
