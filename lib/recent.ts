import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS_TAG, supabaseConfigured } from "./products";

/** Real number of orders per product in the last 7 days (cached 10 minutes). */
const getCounts = unstable_cache(
  async (): Promise<Record<string, number>> => {
    if (!supabaseConfigured) return {};
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await sb.rpc("recent_order_counts");
    if (error) throw new Error(error.message);
    return Object.fromEntries(((data as { product_id: string; orders: number }[]) || []).map((r) => [r.product_id, Number(r.orders)]));
  },
  ["recent-orders-v1"],
  { tags: [PRODUCTS_TAG], revalidate: 600 },
);

export async function recentOrders(productId: string) {
  const counts = await getCounts().catch(() => ({}) as Record<string, number>);
  return counts[productId] || 0;
}
