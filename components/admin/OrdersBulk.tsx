"use client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import { Download, LoaderCircle, Printer, Trash2, X } from "lucide-react";
import { STATUS_LABEL } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/config";

type Ctx = { selected: Set<string>; toggle: (id: string) => void; setMany: (ids: string[], on: boolean) => void; clear: () => void };
const SelectionCtx = createContext<Ctx | null>(null);
const useSel = () => {
  const c = useContext(SelectionCtx);
  if (!c) throw new Error("OrdersBulk components must be inside <OrdersSelection>");
  return c;
};

/** Wraps the orders list so rows can be ticked and edited together. */
export function OrdersSelection({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const value = useMemo<Ctx>(
    () => ({
      selected,
      toggle: (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
      setMany: (ids, on) => setSelected((s) => { const n = new Set(s); ids.forEach((id) => (on ? n.add(id) : n.delete(id))); return n; }),
      clear: () => setSelected(new Set()),
    }),
    [selected],
  );
  return <SelectionCtx.Provider value={value}>{children}</SelectionCtx.Provider>;
}

export function RowCheckbox({ id, label }: { id: string; label: string }) {
  const { selected, toggle } = useSel();
  return <input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} aria-label={`Select ${label}`} className="h-4 w-4 cursor-pointer accent-brand-600" />;
}

export function SelectAll({ ids }: { ids: string[] }) {
  const { selected, setMany } = useSel();
  const all = ids.length > 0 && ids.every((id) => selected.has(id));
  const some = !all && ids.some((id) => selected.has(id));
  return (
    <input
      type="checkbox"
      checked={all}
      ref={(el) => { if (el) el.indeterminate = some; }}
      onChange={() => setMany(ids, !all)}
      aria-label="Select all orders on this page"
      className="h-4 w-4 cursor-pointer accent-brand-600"
    />
  );
}

/** Floating bar shown while orders are ticked: change status (books / cancels PostEx like a single change) or delete. */
export function BulkBar({ orders }: { orders: { id: string; order_number: string; status: string; booked?: boolean }[] }) {
  const router = useRouter();
  const { selected, clear } = useSel();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState<{ ok: number; failed: string[] } | null>(null);
  const picked = orders.filter((o) => selected.has(o.id));
  const booked = picked.filter((o) => o.booked);
  if (!picked.length && !report) return null;

  async function run(kind: "status" | "delete") {
    if (kind === "status" && !status) return;
    const verb = kind === "delete" ? "Delete" : `Mark as ${STATUS_LABEL[status as keyof typeof STATUS_LABEL] || status}`;
    const extra =
      kind === "delete" ? "\n\nThis can't be undone. Booked PostEx parcels are cancelled first; unshipped items go back into stock." :
      status === "confirmed" ? "\n\nConfirming books each order on PostEx." :
      status === "cancelled" ? "\n\nCancelling also cancels booked PostEx parcels and restocks the items." : "";
    if (!confirm(`${verb} ${picked.length} order${picked.length > 1 ? "s" : ""}?${extra}`)) return;
    let ok = 0;
    const failed: string[] = [];
    for (const [n, o] of picked.entries()) {
      setBusy(`${n + 1} / ${picked.length}`);
      if (kind === "status" && o.status === status) { ok++; continue; }
      const res = await fetch(`/api/admin/orders/${o.id}`, {
        method: kind === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: kind === "delete" ? undefined : JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) ok++;
      else failed.push(`${o.order_number}: ${data.error || "failed"}`);
    }
    setBusy(null);
    setReport({ ok, failed });
    clear();
    router.refresh();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-12px_rgba(0,0,0,.25)] backdrop-blur lg:left-64">
      {report && !picked.length ? (
        <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
          <div>
            <p className="font-semibold">{report.ok} order{report.ok === 1 ? "" : "s"} updated{report.failed.length ? `, ${report.failed.length} failed` : ""}.</p>
            {report.failed.map((f) => <p key={f} className="text-xs text-rose-700">{f}</p>)}
          </div>
          <button onClick={() => setReport(null)} className="p-1 text-gray-500 hover:text-ink" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold">{picked.length} selected</p>
          <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={!!busy} className="input h-10 w-auto py-0 text-sm" aria-label="New status">
            <option value="">Change status to…</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <button onClick={() => run("status")} disabled={!status || !!busy} className="h-10 bg-gray-900 px-4 text-xs font-semibold uppercase tracking-wider text-white hover:bg-black disabled:opacity-40">Apply</button>
          <a
            href={`/api/admin/orders/pdf?ids=${picked.map((o) => o.id).join(",")}`}
            className="inline-flex h-10 items-center gap-1.5 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Download PDF ({picked.length})
          </a>
          {booked.length > 0 && (
            <a
              href={`/api/admin/orders/airway-bills?ids=${booked.map((o) => o.id).join(",")}`}
              target="_blank"
              rel="noopener"
              title={booked.length < picked.length ? `${picked.length - booked.length} selected order(s) aren't booked on PostEx yet` : undefined}
              className="inline-flex h-10 items-center gap-1.5 border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" /> Print airway bills ({booked.length})
            </a>
          )}
          <button onClick={() => run("delete")} disabled={!!busy} className="inline-flex h-10 items-center gap-1.5 border border-rose-300 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          {busy ? (
            <span className="inline-flex items-center gap-2 text-sm text-gray-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Working {busy}…</span>
          ) : (
            <button onClick={clear} className="ml-auto text-xs font-semibold text-gray-500 hover:text-ink">Clear selection</button>
          )}
        </div>
      )}
    </div>
  );
}
