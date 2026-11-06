"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle, PackageCheck, Printer, RefreshCw, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" }) : "—");

export default function PostExPanel({ order, suggestedCity }: { order: Order; suggestedCity: string | null }) {
  const router = useRouter();
  const booked = order.courier === "PostEx" && Boolean(order.tracking_number);
  const [city, setCity] = useState(order.postex_city || suggestedCity || "");
  const [cities, setCities] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [notify, setNotify] = useState(true);

  useEffect(() => {
    if (booked) return;
    createClient()
      .from("postex_cities")
      .select("name")
      .eq("is_delivery", true)
      .order("name")
      .then(({ data }) => setCities((data || []).map((c) => c.name)));
  }, [booked]);

  const cityValid = cities.length === 0 || cities.some((c) => c.toUpperCase() === city.trim().toUpperCase());

  async function call(action: "book" | "preview") {
    setBusy(action);
    setMsg(null);
    const res = await fetch(`/api/admin/orders/${order.id}/postex`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, city, notify }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (action === "preview") {
      if (res.ok) setPreview(data.payload);
      else setMsg({ ok: false, text: data.error || "Preview failed" });
      return;
    }
    if (!res.ok || !data.ok) return setMsg({ ok: false, text: data.error || "Booking failed" });
    setMsg({ ok: true, text: `Booked on PostEx · ${data.tracking_number}${data.emailed ? " · customer emailed ✉️" : ""}` });
    router.refresh();
  }

  async function sync() {
    setBusy("sync");
    setMsg(null);
    const res = await fetch("/api/admin/postex-sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setMsg({ ok: false, text: data.error || "Sync failed" });
    setMsg({ ok: true, text: `Synced ${data.checked} shipment${data.checked === 1 ? "" : "s"} · ${data.updated} updated` });
    router.refresh();
  }

  const history = order.postex_history?.transactionStatusHistory || [];

  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold"><Truck className="h-5 w-5 text-brand-600" /> PostEx</h2>
        {booked && (
          <span className="badge bg-sky-50 text-sky-800 ring-sky-600/20">{order.postex_status || "Booked"}</span>
        )}
      </div>

      {booked ? (
        <>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Tracking #</dt><dd className="font-mono font-semibold">{order.tracking_number}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gray-500">PostEx city</dt><dd>{order.postex_city || "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-gray-500">Last synced</dt><dd>{fmt(order.postex_synced_at)}</dd></div>
          </dl>
          {history.length > 0 && (
            <ol className="space-y-2 border-l-2 border-gray-100 pl-4 text-sm">
              {history.map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500" />
                  <p className="font-medium">{h.transactionStatusMessage}</p>
                  {h.updatedAt && <p className="text-xs text-gray-500">{fmt(h.updatedAt)}</p>}
                </li>
              ))}
            </ol>
          )}
          <div className="grid grid-cols-2 gap-2">
            <a href={`/api/admin/orders/${order.id}/airway-bill`} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-2.5 text-[11px]">
              <Printer className="h-4 w-4" /> Airway bill
            </a>
            <button onClick={sync} disabled={!!busy} className="btn-secondary px-3 py-2.5 text-[11px]">
              {busy === "sync" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync now
            </button>
          </div>
          <p className="text-xs text-gray-500">Status updates from PostEx are pulled automatically every 15 minutes. Cancelling this order here also cancels it on PostEx.</p>
        </>
      ) : order.status === "cancelled" ? (
        <p className="text-sm text-gray-500">This order is cancelled.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">After confirming with the customer by phone, approve the order to create the PostEx shipment automatically.</p>
          <div>
            <label className="label" htmlFor="postex-city">PostEx delivery city</label>
            <input id="postex-city" list="postex-cities" value={city} onChange={(e) => setCity(e.target.value)} className="input" placeholder="Start typing…" />
            <datalist id="postex-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            <p className={`mt-1 text-xs ${cityValid && city ? "text-emerald-700" : "text-amber-700"}`}>
              {!city ? `Customer typed “${order.city}” — choose the matching PostEx city.` : cityValid ? "✓ PostEx delivers here" : "Not on PostEx's list — pick a city from the suggestions"}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Email the customer an order confirmation
          </label>
          <button onClick={() => call("book")} disabled={!!busy || !city || !cityValid} className="btn-primary w-full">
            {busy === "book" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />} Confirm &amp; book on PostEx
          </button>
          <button onClick={() => call("preview")} disabled={!!busy} className="w-full text-xs font-medium text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline">
            {busy === "preview" ? "Loading…" : "Preview what will be sent to PostEx"}
          </button>
          {preview && (
            <dl className="space-y-1 border border-gray-100 bg-gray-50 p-3 text-xs">
              {Object.entries(preview).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-gray-500">{k}</dt><dd className="truncate text-right font-medium">{String(v)}</dd></div>
              ))}
            </dl>
          )}
          {order.postex_error && !msg && <p className="bg-rose-50 p-2.5 text-xs text-rose-700">Last attempt failed: {order.postex_error}</p>}
        </>
      )}
      {msg && <p className={`p-2.5 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{msg.text}</p>}
    </div>
  );
}
