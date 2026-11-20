import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminProduct } from "@/components/admin/OrderFormModal";

/** Active products for the admin order form (name, price, stock, buy-2 saving). */
export async function adminProducts(supabase: SupabaseClient): Promise<AdminProduct[]> {
  const { data } = await supabase.from("products").select("id, name, price, stock, bundle_save").eq("is_active", true).order("name");
  return ((data || []) as AdminProduct[]).map((p) => ({ ...p, price: Number(p.price), stock: Number(p.stock), bundle_save: Number(p.bundle_save || 0) }));
}
