import Link from "next/link";
import { ExternalLink, ImageIcon, Pencil, Plus, Search, Video } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import ProductQuickControls from "@/components/admin/ProductQuickControls";
import { createClient } from "@/lib/supabase/server";
import { discountPercent, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All products" },
  { key: "live", label: "Live" },
  { key: "hidden", label: "Hidden" },
  { key: "low", label: "Low stock" },
  { key: "nocost", label: "No buying price" },
] as const;

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const { filter = "all", q = "" } = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: costRows }] = await Promise.all([
    supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false }),
    supabase.from("product_costs").select("product_id, cost"),
  ]);
  const all = (data || []) as Product[];
  const costs = new Map((costRows || []).map((c) => [c.product_id as string, Number(c.cost)]));

  const counts: Record<string, number> = {
    all: all.length,
    live: all.filter((p) => p.is_active).length,
    hidden: all.filter((p) => !p.is_active).length,
    low: all.filter((p) => p.stock <= 5).length,
    nocost: all.filter((p) => !costs.has(p.id)).length,
  };
  const stockValue = all.reduce((s, p) => s + (costs.get(p.id) ?? 0) * Math.max(0, p.stock), 0);

  const term = q.trim().toLowerCase();
  const products = all.filter((p) => {
    if (filter === "live" && !p.is_active) return false;
    if (filter === "hidden" && p.is_active) return false;
    if (filter === "low" && p.stock > 5) return false;
    if (filter === "nocost" && costs.has(p.id)) return false;
    return !term || `${p.name} ${p.category} ${p.slug}`.toLowerCase().includes(term);
  });

  const href = (f: string) => {
    const sp = new URLSearchParams();
    if (f !== "all") sp.set("filter", f);
    if (q) sp.set("q", q);
    const s = sp.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };

  const margin = (p: Product) => {
    const c = costs.get(p.id);
    if (c === undefined) return null;
    return { cost: c, profit: p.price - c, pct: Math.round(((p.price - c) / p.price) * 100) };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            {counts.live} live · {counts.low > 0 ? `${counts.low} running low` : "stock looks healthy"} · stock value at cost {formatPrice(stockValue)}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
      </div>

      {/* Filter tiles */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const warn = (f.key === "low" || f.key === "nocost") && counts[f.key] > 0;
          return (
            <Link
              key={f.key}
              href={href(f.key)}
              className={`border px-3 py-3 transition ${active ? "border-ink bg-ink text-white" : "border-ink/10 bg-white hover:border-ink/40"}`}
            >
              <span className={`block text-[11px] font-medium uppercase tracking-wider ${active ? "text-white/70" : warn ? "text-amber-700" : "text-gray-500"}`}>{f.label}</span>
              <span className="mt-1 block text-xl font-bold tabular-nums">{counts[f.key]}</span>
            </Link>
          );
        })}
      </div>

      <form className="relative">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input name="q" defaultValue={q} placeholder="Search products by name or category" className="input pl-9" />
      </form>

      {/* Desktop table */}
      <div className="card hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50/80 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Cost &amp; profit</th>
              <th className="px-5 py-3 font-medium">Stock &amp; visibility</th>
              <th className="w-24 px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {products.map((p) => {
              const m = margin(p);
              const off = discountPercent(p.price, p.compare_at_price);
              return (
                <tr key={p.id} className={`transition hover:bg-gray-50/70 ${p.is_active ? "" : "opacity-60"}`}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-ink/5 bg-white">
                        <ProductImage src={p.images[0]} alt={p.name} sizes="56px" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink hover:underline">{p.name}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-gray-500">
                          <span>{p.category}</span>
                          <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" />{p.images.length}</span>
                          <span className={`inline-flex items-center gap-1 ${p.videos.length ? "" : "text-amber-600"}`}><Video className="h-3 w-3" />{p.videos.length || "no video"}</span>
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <p className="font-semibold tabular-nums">{formatPrice(p.price)}</p>
                    {off > 0 && <p className="text-xs text-gray-400"><span className="line-through">{formatPrice(p.compare_at_price!)}</span> · −{off}%</p>}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-xs">
                    {m ? (
                      <>
                        <p className="text-gray-500">Cost {formatPrice(m.cost)}</p>
                        <p className="font-semibold text-emerald-700">+{formatPrice(m.profit)} <span className="font-normal text-emerald-600">({m.pct}%)</span></p>
                      </>
                    ) : (
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-amber-700 hover:underline">Add buying price</Link>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <ProductQuickControls id={p.id} stock={p.stock} isActive={p.is_active} isFeatured={p.is_featured} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-ink">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${p.name} on the store`} className="flex h-8 w-8 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-ink">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={5} className="p-12 text-center text-gray-500">No products match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="space-y-3 lg:hidden">
        {products.map((p) => {
          const m = margin(p);
          return (
            <div key={p.id} className={`card p-4 ${p.is_active ? "" : "opacity-60"}`}>
              <Link href={`/admin/products/${p.id}`} className="flex items-start gap-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden border border-ink/5 bg-white">
                  <ProductImage src={p.images[0]} alt={p.name} sizes="64px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{p.category}</span>
                  <span className="mt-1 flex flex-wrap items-baseline gap-x-3 text-sm">
                    <span className="font-semibold tabular-nums">{formatPrice(p.price)}</span>
                    {m ? (
                      <span className="text-xs text-emerald-700">+{formatPrice(m.profit)} ({m.pct}%)</span>
                    ) : (
                      <span className="text-xs text-amber-700">No buying price</span>
                    )}
                  </span>
                </span>
                <Pencil className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
              </Link>
              <div className="mt-3 border-t border-ink/5 pt-3">
                <ProductQuickControls id={p.id} stock={p.stock} isActive={p.is_active} isFeatured={p.is_featured} layout="stack" />
              </div>
            </div>
          );
        })}
        {products.length === 0 && <p className="card p-10 text-center text-gray-500">No products match.</p>}
      </div>
    </div>
  );
}
