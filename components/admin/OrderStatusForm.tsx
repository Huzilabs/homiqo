"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUSES } from "@/lib/config";
import { STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrderStatusForm({ order }: { order: Order }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const status = String(f.get("status"));
    if (status === "cancelled" && order.status !== "cancelled" && !confirm("Cancel this order? Stock will be returned to inventory.")) return;
    setSaving(true);
    setMsg(null);
    const { error } = await createClient()
      .from("orders")
      .update({
        status,
        courier: String(f.get("courier") || "").trim() || null,
        tracking_number: String(f.get("tracking_number") || "").trim() || null,
      })
      .eq("id", order.id);
    setSaving(false);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Order updated" });
    if (!error) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <h2 className="font-bold">Update order</h2>
      <div>
        <label className="label" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={order.status} className="input">
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s === "pending" ? "Pending" : STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="courier">Courier</label>
        <input id="courier" name="courier" list="couriers" defaultValue={order.courier || ""} className="input" placeholder="e.g. TCS, Leopards, PostEx" />
        <datalist id="couriers">
          {["TCS", "Leopards", "PostEx", "M&P", "Trax", "Call Courier", "BlueEx", "Pakistan Post"].map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div>
        <label className="label" htmlFor="tracking_number">Tracking number</label>
        <input id="tracking_number" name="tracking_number" defaultValue={order.tracking_number || ""} className="input" />
      </div>
      {msg && <p className={`rounded-lg p-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{msg.text}</p>}
      <button disabled={saving} className="btn-primary w-full">
        {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} Save
      </button>
    </form>
  );
}
