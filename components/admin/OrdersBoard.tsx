"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, MessageCircle, Phone, Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";

export type BoardOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  city: string;
  phone: string;
  status: string;
  total: number;
  payment_method: string;
  courier: string | null;
  tracking_number: string | null;
  postex_status: string | null;
  created_at: string;
  items: { name: string; qty: number }[];
};

const COLUMNS = [
  { key: "pending", label: "Pending", dot: "bg-amber-500", hint: "Call to confirm" },
  { key: "confirmed", label: "Confirmed", dot: "bg-blue-500", hint: "Booked on PostEx" },
  { key: "shipped", label: "Shipped", dot: "bg-purple-500", hint: "With the courier" },
  { key: "delivered", label: "Delivered", dot: "bg-emerald-500", hint: "Paid & done" },
  { key: "cancelled", label: "Cancelled", dot: "bg-rose-500", hint: "" },
] as const;

const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? "92" + d.slice(1) : d;
};
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Kanban view of orders: drag a card to another column (or use its menu) to change the status. */
export default function OrdersBoard({ orders }: { orders: BoardOrder[] }) {
  const router = useRouter();
  const [moving, setMoving] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [local, setLocal] = useState<Record<string, string>>({});
  const statusOf = (o: BoardOrder) => local[o.id] || o.status;

  async function move(o: BoardOrder, next: string) {
    const prev = statusOf(o);
    if (next === prev || moving) return;
    const onPostEx = o.courier === "PostEx" && Boolean(o.tracking_number);
    if (next === "cancelled" && !confirm(`Cancel order ${o.order_number}?${onPostEx ? " The PostEx shipment will be cancelled too." : ""} Stock will be returned.`)) return;
    setError(null);
    setMoving(o.id);
    setLocal((l) => ({ ...l, [o.id]: next }));
    const res = await fetch(`/api/admin/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, courier: o.courier, tracking_number: o.tracking_number }),
    });
    const data = await res.json().catch(() => ({}));
    setMoving(null);
    if (!res.ok) {
      setLocal((l) => ({ ...l, [o.id]: prev }));
      setError(`${o.order_number}: ${data.needs_city ? "city not on PostEx list — open the order to pick it" : data.error || "update failed"}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error && <p className="mb-3 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <p className="mb-3 text-xs text-gray-500">Drag a card to another column — or use its status menu — to update the order. Confirming books it on PostEx.</p>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {COLUMNS.map((c) => {
          const list = orders.filter((o) => statusOf(o) === c.key);
          const sum = list.reduce((s, o) => s + Number(o.total), 0);
          return (
            <section
              key={c.key}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(c.key);
              }}
              onDragLeave={() => setOver((v) => (v === c.key ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const o = orders.find((x) => x.id === e.dataTransfer.getData("text/plain"));
                if (o) move(o, c.key);
              }}
              className={`flex min-w-[240px] flex-1 basis-0 flex-col border bg-gray-50/80 transition ${over === c.key ? "border-ink bg-white" : "border-ink/10"}`}
            >
              <header className="border-b border-ink/10 bg-white px-3 py-2.5">
                <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                  <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${c.dot}`} />{c.label}</span>
                  <span className="tabular-nums text-ink">{list.length}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">{formatPrice(sum)}{c.hint ? ` · ${c.hint}` : ""}</p>
              </header>
              <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-2">
                {list.map((o) => (
                  <article
                    key={o.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
                    className={`cursor-grab border border-ink/10 bg-white p-3 text-sm shadow-sm active:cursor-grabbing ${moving === o.id ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.order_number}</Link>
                      <span className="text-right font-semibold tabular-nums">
                        {formatPrice(o.total)}
                        <span className={`block text-[9px] font-medium uppercase tracking-wider ${o.payment_method === "bank_transfer" ? "text-violet-700" : "text-gray-400"}`}>
                          {o.payment_method === "bank_transfer" ? "Bank" : "COD"}
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 truncate font-medium">{o.customer_name} <span className="font-normal text-gray-500">· {o.city}</span></p>
                    <p className="truncate text-xs text-gray-500">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{when(o.created_at)}</p>
                    {o.courier === "PostEx" && o.tracking_number && (
                      <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-gray-600"><Truck className="h-3 w-3" /> {o.tracking_number} · {o.postex_status || "Booked"}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-ink/5 pt-2">
                      <select
                        value={statusOf(o)}
                        disabled={moving === o.id}
                        onChange={(e) => move(o, e.target.value)}
                        aria-label={`Status of ${o.order_number}`}
                        className="border border-ink/15 bg-white px-2 py-1 text-xs font-medium"
                      >
                        {COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                      <span className="flex items-center gap-1">
                        {moving === o.id && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
                        <a href={`tel:${o.phone}`} aria-label="Call" className="flex h-7 w-7 items-center justify-center border border-ink/10 text-gray-600"><Phone className="h-3.5 w-3.5" /></a>
                        <a href={`https://wa.me/${waNumber(o.phone)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-7 w-7 items-center justify-center border border-ink/10 text-emerald-600"><MessageCircle className="h-3.5 w-3.5" /></a>
                      </span>
                    </div>
                  </article>
                ))}
                {list.length === 0 && <p className="p-4 text-center text-xs text-gray-400">No orders</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
