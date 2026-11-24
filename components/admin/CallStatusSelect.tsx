"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CALL_STATUSES, callStatus } from "@/lib/call-status";

/** Small pill to record how the confirmation call went (website only — PostEx never sees it). */
export default function CallStatusSelect({ id, value, attempts = 0 }: { id: string; value?: string | null; attempts?: number }) {
  const router = useRouter();
  const [cur, setCur] = useState(value || "");
  const [n, setN] = useState(attempts);
  const [busy, setBusy] = useState(false);
  const c = callStatus(cur);

  async function change(next: string) {
    const prev = cur;
    setCur(next);
    setBusy(true);
    const meta = callStatus(next);
    const tries = meta?.attempt ? n + 1 : n;
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ call_status: next || null, call_attempts: tries, call_status_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setCur(prev);
      setBusy(false);
      alert(`Could not save: ${error.message}`);
      return;
    }
    setN(tries);
    const { data: o } = await supabase.from("orders").select("status").eq("id", id).maybeSingle();
    await supabase.from("order_events").insert({
      order_id: id,
      status: o?.status || "pending",
      note: meta ? `Call: ${meta.label}${meta.attempt ? ` (attempt ${tries})` : ""}` : "Call label cleared",
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-1">
      <select
        value={cur}
        disabled={busy}
        onChange={(e) => change(e.target.value)}
        aria-label="Call status"
        className={`max-w-[11rem] rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset disabled:opacity-60 ${c ? c.style : "bg-white text-gray-500 ring-gray-300"}`}
      >
        <option value="">📞 Call status…</option>
        {CALL_STATUSES.map((s) => (
          <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>
        ))}
      </select>
      {n > 0 && <span className="text-[10px] font-semibold text-orange-700" title="Unanswered call attempts">×{n}</span>}
    </span>
  );
}
