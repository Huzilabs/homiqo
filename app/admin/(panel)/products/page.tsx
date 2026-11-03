import ProductsAdminView from "@/components/admin/ProductsAdminView";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const { filter = "all", q = "" } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: costRows }] = await Promise.all([
    supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false }),
    supabase.from("product_costs").select("product_id, cost"),
  ]);
  const all = (data || []) as Product[];
  const costs = new Map((costRows || []).map((c) => [c.product_id as string, Number(c.cost)]));

  return <ProductsAdminView all={all} costs={costs} filter={filter} q={q} />;
}
