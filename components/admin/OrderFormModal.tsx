"use client";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { PK_MOBILE_PATTERN } from "@/lib/phone";

export type AdminProduct = { id: string; name: string; price: number; stock: number; bundle_save?: number | null };
export type OrderDraft = {
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  items: { product_id: string; quantity: number }[];
};

const POPULAR = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"];
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Admin popup to create an order (Orders page) or fix an abandoned checkout and turn it into an order.
 * `onSave` (optional) stores the edited details without creating an order.
 */
export default function OrderFormModal({
  title,
  products,
  initial,
  onClose,
  onCreate,
  onSave,
  submitLabel = "Create order",
  showConfirm = true,
  notice,
}: {
  title: string;
  products: AdminProduct[];
  initial: OrderDraft;
  onClose: () => void;
  onCreate: (draft: OrderDraft, confirm: boolean) => Promise<string | null>; // returns an error message or null
  onSave?: (draft: OrderDraft) => Promise<string | null>;
  submitLabel?: string;
  showConfirm?: boolean;
  notice?: string;
}) {
  const [d, setD] = useState<OrderDraft>(() => ({
    ...initial,
    items: initial.items.length ? initial.items : [{ product_id: products[0]?.id || "", quantity: 1 }],
  }));
  const [confirmNow, setConfirmNow] = useState(true);
  const [busy, setBusy] = useState<"create" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>(POPULAR);

  useEffect(() => {
    createClient()
      .from("postex_cities")
      .select("name")
      .eq("is_delivery", true)
      .order("name")
      .then(({ data }) => data?.length && setCities(Array.from(new Set([...POPULAR, ...data.map((c) => titleCase(c.name))]))));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const lines = d.items.map((i) => {
    const p = byId.get(i.product_id);
    const price = Number(p?.price || 0);
    const bundle = Math.floor(i.quantity / 2) * Number(p?.bundle_save || 0);
    return { ...i, p, total: price * i.quantity - bundle, bundle };
  });
  const total = lines.reduce((s, l) => s + l.total, 0);
  const set = <K extends keyof OrderDraft>(k: K, v: OrderDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setItem = (idx: number, patch: Partial<OrderDraft["items"][number]>) =>
    setD((x) => ({ ...x, items: x.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));

  async function run(kind: "create" | "save", e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (kind === "create" && !lines.every((l) => l.p)) return setError("Choose a product for every line.");
    setBusy(kind);
    const draft = { ...d, items: d.items.filter((i) => i.product_id && i.quantity > 0) };
    const err = kind === "create" ? await onCreate(draft, confirmNow) : await onSave!(draft);
    setBusy(null);
    if (err) setError(err);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose} role="presentation">
      <form
        onSubmit={(e) => run("create", e)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[94svh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-gray-500 hover:text-gray-900"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Products</p>
            {lines.map((l, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={l.product_id}
                  onChange={(e) => setItem(idx, { product_id: e.target.value })}
                  className="input min-w-0 flex-1"
                  required
                >
                  <option value="">Choose a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} — {formatPrice(p.price)}{p.stock <= 0 ? " (sold out)" : ` · ${p.stock} in stock`}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={l.quantity}
                  onChange={(e) => setItem(idx, { quantity: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
                  className="input w-20"
                  aria-label="Quantity"
                />
                {d.items.length > 1 && (
                  <button type="button" onClick={() => set("items", d.items.filter((_, i) => i !== idx))} aria-label="Remove product" className="p-2 text-gray-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => set("items", [...d.items, { product_id: "", quantity: 1 }])} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              <Plus className="h-4 w-4" /> Add another product
            </button>
            {lines.some((l) => l.bundle > 0) && <p className="text-xs text-emerald-700">Buy-2 saving applied automatically.</p>}
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 sm:col-span-2">Customer</p>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="of-name">Full name *</label>
              <input id="of-name" required value={d.customer_name} onChange={(e) => set("customer_name", e.target.value)} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="of-phone">Phone *</label>
              <input id="of-phone" type="tel" required pattern={PK_MOBILE_PATTERN} title="Complete mobile number, e.g. 0300 1234567" placeholder="03XX XXXXXXX" value={d.phone} onChange={(e) => set("phone", e.target.value)} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="of-city">City *</label>
              <input id="of-city" required list="of-cities" value={d.city} onChange={(e) => set("city", e.target.value)} className="input" placeholder="Start typing…" />
              <datalist id="of-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="of-address">Complete address *</label>
              <textarea id="of-address" required minLength={5} rows={2} value={d.address} onChange={(e) => set("address", e.target.value)} className="input" placeholder="House #, street, area / block, landmark" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="of-notes">Note (printed on the PostEx airway bill)</label>
              <input id="of-notes" value={d.notes} onChange={(e) => set("notes", e.target.value)} className="input" placeholder="e.g. Call before delivery" />
            </div>
          </section>

          {notice && <p className="bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}
          {showConfirm && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={confirmNow} onChange={(e) => setConfirmNow(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span>Customer already confirmed — mark the order <b>Confirmed</b> (then book it on PostEx from the order page)</span>
          </label>
          )}
        </div>

        <div className="border-t bg-gray-50 px-5 py-3">
          {error && <p className="mb-2 bg-rose-50 p-2 text-sm text-rose-700" role="alert">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">Total (COD, free delivery): <b className="text-base">{formatPrice(total)}</b></p>
            <div className="flex gap-2">
              {onSave && (
                <button type="button" onClick={() => run("save")} disabled={!!busy} className="border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-500">
                  {busy === "save" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Save changes"}
                </button>
              )}
              <button type="submit" disabled={!!busy} className="inline-flex items-center gap-2 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
                {busy === "create" && <LoaderCircle className="h-4 w-4 animate-spin" />} {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
