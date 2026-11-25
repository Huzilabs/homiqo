"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, Package, Radio, X } from "lucide-react";
import OrdersSearch from "./OrdersSearch";

export const ORDER_SOURCES = [
  { key: "website", label: "🌐 Website" },
  { key: "meta", label: "⚡ Meta offer" },
  { key: "whatsapp", label: "💬 WhatsApp" },
  { key: "abandoned", label: "🛒 Abandoned checkout" },
] as const;

export const ORDER_DATES = [
  { key: "", label: "All time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
] as const;

/** Orders page toolbar: live search + date / source / product filters (keeps status & view). */
export default function OrderFilters({ products, todayCount }: { products: { id: string; name: string }[]; todayCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const src = params.get("src") || "";
  const product = params.get("product") || "";
  const when = params.get("when") || "";

  const go = (patch: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) v ? sp.set(k, v) : sp.delete(k);
    sp.delete("page");
    const q = sp.toString();
    router.push(`${pathname}${q ? `?${q}` : ""}`, { scroll: false });
  };
  const active = Boolean(src || product || when);

  const pill = (on: boolean) =>
    `relative inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed pl-2.5 pr-7 text-[13px] font-medium transition ${
      on ? "border-solid border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-600 hover:border-gray-500"
    }`;

  return (
    <div className="space-y-3 p-3 sm:p-4">
      <OrdersSearch />
      <div className="flex flex-wrap items-center gap-2">
        {/* date — segmented */}
        <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-gray-100 p-0.5" role="group" aria-label="Date">
          <CalendarDays className="ml-2 mr-1 h-4 w-4 shrink-0 text-gray-500" />
          {ORDER_DATES.map((d) => (
            <button
              key={d.key}
              onClick={() => go({ when: d.key })}
              className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[13px] font-medium transition ${
                when === d.key ? "bg-white text-ink shadow-sm ring-1 ring-black/5" : "text-gray-600 hover:text-ink"
              }`}
            >
              {d.label}
              {d.key === "today" && todayCount > 0 && (
                <span className="ml-1.5 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{todayCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* source */}
        <label className={pill(Boolean(src))}>
          <Radio className="h-4 w-4 shrink-0 opacity-70" />
          <select value={src} onChange={(e) => go({ src: e.target.value })} aria-label="Order source" className="absolute inset-0 cursor-pointer appearance-none opacity-0">
            <option value="">All sources</option>
            {ORDER_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <span className="pointer-events-none whitespace-nowrap">{ORDER_SOURCES.find((s) => s.key === src)?.label || "All sources"}</span>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 opacity-60" />
        </label>

        {/* product */}
        <label className={`${pill(Boolean(product))} max-w-full`}>
          <Package className="h-4 w-4 shrink-0 opacity-70" />
          <select value={product} onChange={(e) => go({ product: e.target.value })} aria-label="Product" className="absolute inset-0 cursor-pointer appearance-none opacity-0">
            <option value="">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="pointer-events-none max-w-[220px] truncate">{products.find((p) => p.id === product)?.name || "All products"}</span>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 opacity-60" />
        </label>

        {active && (
          <button onClick={() => go({ src: "", product: "", when: "" })} className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900">
            <X className="h-4 w-4" /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}
