"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

export default function PostExSyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      {note && <span className="text-xs text-gray-500">{note}</span>}
      <button
        onClick={async () => {
          setBusy(true);
          const res = await fetch("/api/admin/postex-sync", { method: "POST" });
          const d = await res.json().catch(() => ({}));
          setBusy(false);
          setNote(res.ok ? `${d.checked} checked · ${d.updated} updated` : d.error || "Sync failed");
          router.refresh();
        }}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-60"
      >
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync PostEx
      </button>
    </div>
  );
}
