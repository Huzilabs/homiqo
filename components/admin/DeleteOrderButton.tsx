"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";

export default function DeleteOrderButton({ id, orderNumber, booked }: { id: string; orderNumber: string; booked: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.ok) return setError(data.error || "Delete failed");
    router.push("/admin/orders");
    router.refresh();
  }

  return (
    <div className="card border-rose-200 p-6">
      <h2 className="font-bold text-rose-700">Delete order</h2>
      {!open ? (
        <>
          <p className="mt-1 text-sm text-gray-600">Removes the order permanently — use it for test, duplicate or fake orders.</p>
          <button onClick={() => setOpen(true)} className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" /> Delete this order
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-gray-700">
            Delete <b>{orderNumber}</b> for good? This can&apos;t be undone.
            {booked && " Its PostEx shipment will be cancelled first."} Items not yet shipped go back into stock.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => { setOpen(false); setError(null); }} disabled={busy} className="btn-secondary px-3 py-2.5 text-[11px]">Keep it</button>
            <button onClick={remove} disabled={busy} className="inline-flex items-center justify-center gap-2 bg-rose-600 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-rose-700 disabled:opacity-60">
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Yes, delete
            </button>
          </div>
        </>
      )}
      {error && <p className="mt-3 bg-rose-50 p-2.5 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
