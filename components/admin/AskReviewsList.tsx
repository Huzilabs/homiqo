"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AskReviewButton from "./AskReviewButton";

export type AskRow = { id: string; name: string; city: string; order_number: string; items: string; href: string };

/** "Ask for reviews" list with select-all + skip selected (marks them asked without messaging). */
export default function AskReviewsList({ rows }: { rows: AskRow[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const all = rows.length > 0 && picked.size === rows.length;
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function skip() {
    if (!picked.size) return;
    setBusy(true);
    await createClient().from("orders").update({ review_asked_at: new Date().toISOString() }).in("id", [...picked]);
    setPicked(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[13px]">
        <label className="flex cursor-pointer items-center gap-2 font-medium text-gray-700">
          <input type="checkbox" checked={all} onChange={() => setPicked(all ? new Set() : new Set(rows.map((r) => r.id)))} className="h-4 w-4 accent-gray-900" />
          Select all
        </label>
        {picked.size > 0 && (
          <button onClick={skip} disabled={busy} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-60">
            {busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />} Skip {picked.size} selected
          </button>
        )}
      </div>
      <ul className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">
        {rows.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <label className="flex min-w-0 cursor-pointer items-start gap-3">
              <input type="checkbox" checked={picked.has(o.id)} onChange={() => toggle(o.id)} className="mt-1 h-4 w-4 shrink-0 accent-gray-900" aria-label={`Select ${o.name}`} />
              <span className="min-w-0">
                <span className="font-medium">{o.name}</span> <span className="text-gray-500">· {o.city} · {o.order_number}</span>
                <span className="block truncate text-xs text-gray-500">{o.items}</span>
              </span>
            </label>
            <AskReviewButton orderId={o.id} href={o.href} />
          </li>
        ))}
      </ul>
    </>
  );
}
