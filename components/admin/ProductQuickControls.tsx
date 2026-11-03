"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Patch = { stock?: number; is_active?: boolean; is_featured?: boolean };

/** Inline stock editor + live/featured switches for the products list (no need to open the product). */
export default function ProductQuickControls({
  id,
  stock,
  isActive,
  isFeatured,
  part = "all",
}: {
  id: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  /** stock = stock box only, visibility = Live/Featured switches only, all = both (mobile cards) */
  part?: "stock" | "visibility" | "all";
}) {
  const router = useRouter();
  const [qty, setQty] = useState(String(stock));
  const [active, setActive] = useState(isActive);
  const [featured, setFeatured] = useState(isFeatured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: Patch, undo: () => void) {
    setBusy(true);
    setError(null);
    const { error } = await createClient().from("products").update(patch).eq("id", id);
    setBusy(false);
    if (error) {
      undo();
      setError(error.message);
      return;
    }
    fetch("/api/revalidate", { method: "POST" }).catch(() => {}); // refresh the storefront cache
    router.refresh();
  }

  const saveStock = () => {
    const n = Math.max(0, Math.floor(Number(qty)));
    if (!Number.isFinite(n) || n === stock) return setQty(String(stock));
    setQty(String(n));
    save({ stock: n }, () => setQty(String(stock)));
  };

  const low = Number(qty) <= 5;

  const stockBox = (
    <label className="flex items-center gap-2 text-sm text-gray-500">
      {part === "all" && "Stock"}
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onBlur={saveStock}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        aria-label="Stock"
        className={`w-20 border px-2 py-2 text-center text-base font-semibold tabular-nums outline-none focus:border-ink ${
          Number(qty) === 0 ? "border-rose-300 bg-rose-50 text-rose-700" : low ? "border-amber-300 bg-amber-50 text-amber-800" : "border-gray-200 text-ink"
        }`}
      />
    </label>
  );
  const switches = (
    <div className={part === "all" ? "flex items-center gap-5" : "flex flex-col items-start gap-2.5"}>
      <Switch label="Live" on={active} onChange={(v) => { setActive(v); save({ is_active: v }, () => setActive(!v)); }} />
      <Switch label="Featured" on={featured} onChange={(v) => { setFeatured(v); save({ is_featured: v }, () => setFeatured(!v)); }} />
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {part !== "visibility" && stockBox}
      {part !== "stock" && switches}
      {busy && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
      {error && <span className="basis-full text-xs text-rose-600">{error}</span>}
    </div>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-emerald-500" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}
