import Link from "next/link";
import { CirclePlay, Plus } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default async function AdminProducts() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false });
  const products = (data || []) as Product[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Products <span className="text-base font-medium text-gray-400">({products.length})</span></h1>
        <Link href="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
      </div>
      <div className="card overflow-hidden">
        <ul className="divide-y">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  <ProductImage src={p.images[0]} alt={p.name} sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                    <span>{p.category}</span>
                    <span>{p.images.length} photo{p.images.length === 1 ? "" : "s"}</span>
                    {p.videos.length > 0 && <span className="inline-flex items-center gap-1"><CirclePlay className="h-3 w-3" />{p.videos.length} video</span>}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-semibold">{formatPrice(p.price)}</p>
                  <p className={`text-xs ${p.stock <= 5 ? "text-amber-600" : "text-gray-500"}`}>{p.stock} in stock</p>
                </div>
                <div className="flex w-20 flex-col items-end gap-1">
                  <span className={`badge ${p.is_active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-gray-100 text-gray-600 ring-gray-500/20"}`}>
                    {p.is_active ? "Live" : "Hidden"}
                  </span>
                  {p.is_featured && <span className="badge bg-accent-50 text-accent-600 ring-accent-500/20">Featured</span>}
                </div>
              </Link>
            </li>
          ))}
          {products.length === 0 && <li className="p-10 text-center text-gray-500">No products yet.</li>}
        </ul>
      </div>
    </div>
  );
}
