"use client";
import { useState } from "react";
import { announceConfirmed } from "@/lib/confirm-event";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, PackagePlus, Pencil, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import OrderFormModal, { type AdminProduct, type OrderDraft } from "./OrderFormModal";

export default function LeadActions({ id, status, waHref, lead, products }: { id: string; status: string; waHref: string; lead: OrderDraft; products: AdminProduct[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  async function set(next: "contacted" | "dismissed" | "open") {
    setBusy(true);
    setError(null);
    await createClient().from("checkout_leads").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
    router.refresh();
  }

  // Popup: fix missing details (name, address, city, product…) then save, or create the order
  async function saveLead(d: OrderDraft) {
    const byId = new Map(products.map((p) => [p.id, p]));
    const items = d.items.map((i) => ({ product_id: i.product_id, name: byId.get(i.product_id)?.name || "", quantity: i.quantity, price: byId.get(i.product_id)?.price || 0 }));
    const { error: e } = await createClient()
      .from("checkout_leads")
      .update({
        customer_name: d.customer_name,
        phone: d.phone,
        city: d.city,
        address: d.address,
        items,
        subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (e) return e.message;
    setEditing(false);
    router.refresh();
    return null;
  }

  async function createOrder(d: OrderDraft, confirm: boolean) {
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: d, items: d.items, confirm, lead_id: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || "Could not create the order";
    setEditing(false);
    if (confirm && data.id) { announceConfirmed(data.id); router.refresh(); return null; }
    alert(`Order ${data.order_number} created.${confirm ? " Book it on PostEx from the order page." : " Confirm it in Orders to book PostEx."}`);
    router.refresh();
    return null;
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
          <>
            <button onClick={() => setEditing(true)} disabled={busy} className="inline-flex items-center gap-1.5 bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black">
              <PackagePlus className="h-4 w-4" /> Ordered — create order
            </button>
            <button onClick={() => setEditing(true)} disabled={busy} className="inline-flex items-center gap-1.5 border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-500">
              <Pencil className="h-4 w-4" /> Edit details
            </button>
          </>
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
      {editing && (
        <OrderFormModal title="Abandoned checkout — edit & create order" products={products} initial={lead} onClose={() => setEditing(false)} onCreate={createOrder} onSave={saveLead} />
      )}
    </div>
  );
}
