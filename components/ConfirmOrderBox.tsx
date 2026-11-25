"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";

/** "Please confirm your order" — the link we send on WhatsApp opens the order page with this box. */
export default function ConfirmOrderBox({ orderNumber, phone, total, response }: { orderNumber: string; phone: string; total: number; response?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const [asking, setAsking] = useState(false);
  const [done, setDone] = useState<string | null>(response || null);
  const [error, setError] = useState<string | null>(null);

  async function send(action: "confirm" | "cancel") {
    setBusy(action);
    setError(null);
    const res = await fetch("/api/order-response", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_number: orderNumber, phone, action }) });
    const d = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok || !d.ok) return setError(d.error || "Something went wrong. Please call us.");
    setDone(action === "confirm" ? "confirmed" : d.status === "cancelled" ? "cancelled" : "cancel_requested");
    router.refresh();
  }

  if (done === "confirmed")
    return <p className="mx-auto mt-8 max-w-xl border border-leaf-600/30 bg-leaf-100/60 p-4 text-center text-sm font-semibold text-leaf-600">✅ Shukriya! Aap ne apna order confirm kar diya hai — hum jald dispatch kar dein ge.</p>;
  if (done === "cancelled" || done === "cancel_requested")
    return <p className="mx-auto mt-8 max-w-xl border border-ink/10 bg-white p-4 text-center text-sm text-ink/70">{done === "cancelled" ? "Your order has been cancelled." : "We've received your cancel request — our team will contact you."}</p>;

  return (
    <div className="mx-auto mt-8 max-w-xl border-2 border-accent-600/40 bg-accent-50 p-5 text-center">
      <p className="text-lg font-semibold text-ink">Please confirm your order</p>
      <p className="mt-1 text-sm text-ink/70">Order <b>{orderNumber}</b> · <b>{formatPrice(total)}</b> · Cash on delivery</p>
      <p className="mt-1 text-sm text-ink/60">Apna order confirm karein taake hum foran dispatch kar sakein.</p>
      <button onClick={() => send("confirm")} disabled={!!busy} className="mt-4 inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded bg-leaf-600 px-6 text-[15px] font-semibold text-white hover:bg-leaf-600/90 disabled:opacity-60">
        {busy === "confirm" && <LoaderCircle className="h-4 w-4 animate-spin" />} ✅ Yes, confirm my order
      </button>
      {!asking ? (
        <button onClick={() => setAsking(true)} className="mt-3 block w-full text-xs text-ink/50 underline">I don&apos;t want this order</button>
      ) : (
        <div className="mt-3 text-sm">
          <p className="text-ink/70">Cancel order {orderNumber}?</p>
          <div className="mt-2 flex justify-center gap-2">
            <button onClick={() => send("cancel")} disabled={!!busy} className="inline-flex h-10 items-center gap-2 rounded border border-rose-300 bg-white px-4 font-semibold text-rose-700">
              {busy === "cancel" && <LoaderCircle className="h-4 w-4 animate-spin" />} Yes, cancel
            </button>
            <button onClick={() => setAsking(false)} className="h-10 rounded px-4 text-ink/60">Keep order</button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
