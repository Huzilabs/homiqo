"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Block / unblock a customer's phone number (their new orders get a red "BLOCKED" flag). */
export default function BlockButton({ phone10, blocked }: { phone10: string; blocked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    const sb = createClient();
    if (blocked) {
      if (!confirm("Unblock this customer?")) return;
      setBusy(true);
      await sb.from("blocked_phones").delete().eq("phone10", phone10);
    } else {
      const reason = prompt("Block this customer? Reason (optional), e.g. refused 2 parcels:");
      if (reason === null) return;
      setBusy(true);
      await sb.from("blocked_phones").upsert({ phone10, reason: reason.trim() || null });
    }
    setBusy(false);
    router.refresh();
  }
  return (
    <button onClick={toggle} disabled={busy} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${blocked ? "border border-gray-300 text-gray-700 hover:bg-gray-50" : "text-rose-600 hover:bg-rose-50"}`}>
      {blocked ? "Unblock" : "Block"}
    </button>
  );
}
