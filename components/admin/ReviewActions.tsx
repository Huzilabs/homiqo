"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approved" | "rejected" | "delete") {
    if (action === "delete" && !confirm("Delete this review permanently?")) return;
    setBusy(true);
    setError(null);
    const sb = createClient();
    const { error } =
      action === "delete"
        ? await sb.from("reviews").delete().eq("id", id)
        : await sb.from("reviews").update({ status: action, approved_at: action === "approved" ? new Date().toISOString() : null }).eq("id", id);
    setBusy(false);
    if (error) return setError(error.message);
    fetch("/api/revalidate", { method: "POST" }).catch(() => {}); // update product pages + Google stars
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "approved" && (
        <button onClick={() => run("approved")} disabled={busy} className="inline-flex items-center gap-1.5 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
          <Check className="h-4 w-4" /> Approve
        </button>
      )}
      {status !== "rejected" && (
        <button onClick={() => run("rejected")} disabled={busy} className="inline-flex items-center gap-1.5 border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-500">
          <X className="h-4 w-4" /> {status === "approved" ? "Hide" : "Reject"}
        </button>
      )}
      <button onClick={() => run("delete")} disabled={busy} aria-label="Delete review" className="p-2 text-gray-400 hover:text-rose-600">
        <Trash2 className="h-4 w-4" />
      </button>
      {busy && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
