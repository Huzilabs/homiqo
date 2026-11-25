"use client";
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const Ctx = createContext<{ picked: Set<string>; toggle: (id: string) => void } | null>(null);

/** Wraps the review list: Select all + Approve / Reject (or Hide) selected. */
export function ReviewsSelection({ ids, status, children }: { ids: string[]; status: string; children: React.ReactNode }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const all = ids.length > 0 && picked.size === ids.length;
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function run(to: "approved" | "rejected") {
    if (!picked.size) return;
    setBusy(true);
    setError(null);
    const { error } = await createClient()
      .from("reviews")
      .update({ status: to, approved_at: to === "approved" ? new Date().toISOString() : null })
      .in("id", [...picked]);
    setBusy(false);
    if (error) return setError(error.message);
    setPicked(new Set());
    fetch("/api/revalidate", { method: "POST" }).catch(() => {}); // refresh product pages
    router.refresh();
  }

  return (
    <Ctx.Provider value={{ picked, toggle }}>
      {ids.length > 0 && (
        <div className="sticky top-12 z-20 flex flex-wrap items-center gap-3 border border-ink/10 bg-white px-4 py-2.5 text-sm lg:top-0">
          <label className="flex cursor-pointer items-center gap-2 font-medium text-gray-700">
            <input type="checkbox" checked={all} onChange={() => setPicked(all ? new Set() : new Set(ids))} className="h-4 w-4 accent-gray-900" />
            Select all ({ids.length})
          </label>
          {picked.size > 0 && (
            <span className="ml-auto flex items-center gap-2">
              <span className="text-gray-500">{picked.size} selected</span>
              {status !== "approved" && (
                <button onClick={() => run("approved")} disabled={busy} className="inline-flex items-center gap-1.5 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  <Check className="h-4 w-4" /> Approve selected
                </button>
              )}
              {status !== "rejected" && (
                <button onClick={() => run("rejected")} disabled={busy} className="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-500 disabled:opacity-60">
                  <X className="h-4 w-4" /> {status === "approved" ? "Hide selected" : "Reject selected"}
                </button>
              )}
              {busy && <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />}
            </span>
          )}
          {error && <span className="w-full text-xs text-rose-600">{error}</span>}
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}

export function ReviewCheckbox({ id, label }: { id: string; label: string }) {
  const c = useContext(Ctx);
  if (!c) return null;
  return <input type="checkbox" checked={c.picked.has(id)} onChange={() => c.toggle(id)} aria-label={`Select review by ${label}`} className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-gray-900" />;
}
