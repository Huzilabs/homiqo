"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";

export const ORDER_SOURCES = [
  { key: "website", label: "🌐 Website orders" },
  { key: "meta", label: "⚡ Meta offer customers" },
  { key: "whatsapp", label: "💬 WhatsApp orders" },
  { key: "abandoned", label: "🛒 From abandoned checkouts" },
] as const;

/** Orders page: filter by where the order came from and by product (keeps status / search / view). */
export default function OrderFilters({ products }: { products: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const src = params.get("src") || "";
  const product = params.get("product") || "";

  const set = (key: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete("page");
    const q = sp.toString();
    router.push(`${pathname}${q ? `?${q}` : ""}`);
  };
  const active = src || product;
  const cls = (on: boolean) =>
    `h-10 min-w-0 flex-1 border bg-white px-3 text-sm sm:flex-none ${on ? "border-ink font-semibold text-ink" : "border-ink/15 text-gray-600"}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-500"><Filter className="h-3.5 w-3.5" /> Filter</span>
      <select value={src} onChange={(e) => set("src", e.target.value)} aria-label="Order source" className={cls(Boolean(src))}>
        <option value="">All sources</option>
        {ORDER_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
      <select value={product} onChange={(e) => set("product", e.target.value)} aria-label="Product" className={`${cls(Boolean(product))} sm:max-w-[260px]`}>
        <option value="">All products</option>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {active && (
        <button
          onClick={() => {
            const sp = new URLSearchParams(params.toString());
            sp.delete("src"); sp.delete("product"); sp.delete("page");
            const q = sp.toString();
            router.push(`${pathname}${q ? `?${q}` : ""}`);
          }}
          className="inline-flex items-center gap-1 px-2 text-xs font-semibold text-gray-500 underline"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}
