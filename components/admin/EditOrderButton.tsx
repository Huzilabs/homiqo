"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import OrderFormModal, { type AdminProduct, type OrderDraft } from "./OrderFormModal";

/** Order page: change quantity / products / customer details after the order is created. */
export default function EditOrderButton({ id, products, initial, booked }: { id: string; products: AdminProduct[]; initial: OrderDraft; booked: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function save(d: OrderDraft) {
    const res = await fetch(`/api/admin/orders/${id}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: d, items: d.items }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || "Could not update the order";
    setOpen(false);
    router.refresh();
    if (data.rebook_error) alert(`Order updated (Rs ${data.total}), but PostEx re-booking failed: ${data.rebook_error}\nBook it again from the PostEx box.`);
    else if (data.rebooked) alert(`Order updated — new total Rs ${data.total}. Re-booked on PostEx: ${data.tracking}`);
    return null;
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-action"><Pencil className="h-4 w-4" /> Edit order</button>
      {open && (
        <OrderFormModal
          title="Edit order"
          submitLabel="Save changes"
          showConfirm={false}
          notice={booked ? "This order is booked on PostEx. Saving cancels that booking and books it again with the new amount (only works before pickup)." : undefined}
          products={products}
          initial={initial}
          onClose={() => setOpen(false)}
          onCreate={(d) => save(d)}
        />
      )}
    </>
  );
}
