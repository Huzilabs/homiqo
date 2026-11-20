"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import OrderFormModal, { type AdminProduct, type OrderDraft } from "./OrderFormModal";

/** Orders page: "+ Create order" for WhatsApp / phone orders. */
export default function CreateOrderButton({ products }: { products: AdminProduct[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const empty: OrderDraft = { customer_name: "", phone: "", city: "", address: "", notes: "", items: [] };

  async function create(d: OrderDraft, confirm: boolean) {
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: d, items: d.items, confirm }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || "Could not create the order";
    setOpen(false);
    router.push(`/admin/orders/${data.id}`);
    router.refresh();
    return null;
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-gray-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-black">
        <Plus className="h-4 w-4" /> Create order
      </button>
      {open && <OrderFormModal title="Create order" products={products} initial={empty} onClose={() => setOpen(false)} onCreate={create} />}
    </>
  );
}
