"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/config";
import { STATUS_STYLE } from "@/lib/format";

const LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const BOOK = "__book_postex";

type Props = {
  id: string;
  orderNumber: string;
  status: string;
  courier: string | null;
  trackingNumber: string | null;
};

/** Inline status changer for the orders list — no need to open the order. */
export default function OrderStatusSelect({ id, orderNumber, status, courier, trackingNumber }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onPostEx = courier === "PostEx" && Boolean(trackingNumber);

  async function change(next: string) {
    if (next === value) return;
    if (next === "cancelled" && !confirm(`Cancel order ${orderNumber}?${onPostEx ? " The PostEx shipment will be cancelled too." : ""} Stock will be returned.`)) return;
    setBusy(true);
    setError(null);
    const prev = value;
    setValue(next === BOOK ? "confirmed" : next);
    const res =
      next === BOOK
        ? await fetch(`/api/admin/orders/${id}/postex`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "book" }),
          })
        : await fetch(`/api/admin/orders/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: next, courier, tracking_number: trackingNumber }),
          });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setValue(prev);
      setError(data.needs_city ? "City not on PostEx list — open the order to pick it" : data.error || "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="min-w-[150px]">
      <div className={`relative inline-flex items-center rounded-full ring-1 ring-inset ${STATUS_STYLE[value] || ""}`}>
        <select
          value={value}
          disabled={busy}
          onChange={(e) => change(e.target.value)}
          aria-label={`Status of ${orderNumber}`}
          className="cursor-pointer appearance-none rounded-full bg-transparent py-1.5 pl-3.5 pr-8 text-xs font-semibold outline-none disabled:cursor-wait"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{LABEL[s]}</option>
          ))}
          {value === "pending" && !onPostEx && <option value={BOOK}>Confirm + book PostEx</option>}
        </select>
        {busy ? (
          <LoaderCircle className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5" />
        )}
      </div>
      {error && <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-rose-600">{error}</p>}
    </div>
  );
}
