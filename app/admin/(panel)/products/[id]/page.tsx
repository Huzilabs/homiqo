import { notFound } from "next/navigation";
import BackLink from "@/components/admin/BackLink";
import ProductForm from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: cats }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("products").select("category"),
  ]);
  if (!product) notFound();
  const { data: costRow } = await supabase.from("product_costs").select("cost").eq("product_id", id).maybeSingle();
  const categories = Array.from(new Set((cats || []).map((r: { category: string }) => r.category)));
  return (
    <div className="space-y-6">
      <BackLink href="/admin/products" label="Back to products" />
      <h1 className="text-2xl font-extrabold">Edit product</h1>
      <ProductForm product={product as Product} categories={categories} cost={costRow ? Number(costRow.cost) : null} />
    </div>
  );
}
