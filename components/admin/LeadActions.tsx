"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, PackagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LeadActions({ id, status, waHref }: { id: string; status: string; waHref: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(next: "contacted" | "dismissed" | "open") {
    setBusy(true);
    setError(null);
    await createClient().from("checkout_leads").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
    router.refresh();
  }

  async function makeOrder() {
    if (!confirm("Create a Cash on Delivery order for this customer with the saved name, address and products?")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/leads/${id}/order`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not create the order");
    alert(`Order ${data.order_number} created. Confirm it in Orders to book PostEx.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => status === "open" && set("contacted")}
          className="inline-flex items-center gap-1.5 bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1ebe5b]"
        >
          WhatsApp
        </a>
        {status !== "dismissed" && (
          <button onClick={makeOrder} disabled={busy} className="inline-flex items-center gap-1.5 bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black">
            <PackagePlus className="h-4 w-4" /> Ordered — create order
          </button>
        )}
        {status === "open" && (
          <button onClick={() => set("contacted")} disabled={busy} className="inline-flex items-center gap-1.5 border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-500">
            <Check className="h-4 w-4" /> Contacted
          </button>
        )}
        {status !== "dismissed" ? (
          <button onClick={() => set("dismissed")} disabled={busy} className="inline-flex items-center gap-1.5 border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:border-rose-500">
            <X className="h-4 w-4" /> Cancelled
          </button>
        ) : (
          <button onClick={() => set("open")} disabled={busy} className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700">Restore</button>
        )}
        {busy && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
      </div>
      {error && <p className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}
