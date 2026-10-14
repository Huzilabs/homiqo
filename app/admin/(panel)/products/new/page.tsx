import ProductForm from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("category");
  const categories = Array.from(new Set((data || []).map((r: { category: string }) => r.category)));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Add product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
