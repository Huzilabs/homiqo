"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LeadActions({ id, status, waHref }: { id: string; status: string; waHref: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(next: "contacted" | "dismissed" | "open") {
    setBusy(true);
    await createClient().from("checkout_leads").update({ status: next, updated_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => status === "open" && set("contacted")}
        className="inline-flex items-center gap-1.5 bg-[#25D366] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1ebe5b]"
      >
        WhatsApp
      </a>
      {status === "open" && (
        <button onClick={() => set("contacted")} disabled={busy} className="inline-flex items-center gap-1.5 border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-500">
          <Check className="h-4 w-4" /> Contacted
        </button>
      )}
      {status !== "dismissed" ? (
        <button onClick={() => set("dismissed")} disabled={busy} aria-label="Dismiss" className="p-2 text-gray-400 hover:text-rose-600">
          <X className="h-4 w-4" />
        </button>
      ) : (
        <button onClick={() => set("open")} disabled={busy} className="border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700">Restore</button>
      )}
      {busy && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
    </div>
  );
}
