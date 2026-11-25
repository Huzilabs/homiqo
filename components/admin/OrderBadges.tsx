import type { Order } from "@/lib/types";

export const RISK_LABEL: Record<string, string> = {
  refused_before: "Refused / returned before",
  short_address: "Short address",
  duplicate: "Duplicate order",
  blocked: "BLOCKED customer",
};

/** Small status chips for an order: customer confirmation, delivery problem, risk flags. */
export default function OrderBadges({ o, flags = [] }: { o: Order; flags?: string[] }) {
  const chips: { text: string; cls: string; title?: string }[] = [];
  const open = ["pending", "confirmed"].includes(o.status);
  if (o.customer_response === "cancel_requested" && open) chips.push({ text: "❗ Wants to cancel", cls: "bg-rose-100 text-rose-800" });
  else if (o.customer_response === "confirmed" && open) chips.push({ text: "✓ Customer confirmed", cls: "bg-emerald-100 text-emerald-800" });
  else if (o.status === "pending") chips.push({ text: "Not confirmed yet", cls: "bg-gray-100 text-gray-600" });
  const delivering = ["confirmed", "shipped"].includes(o.status) && !/^(delivered|return)/i.test(o.postex_status || "");
  if (o.postex_attempt_reason && delivering) chips.push({ text: `⚠ ${o.postex_attempt_reason}`, cls: "bg-amber-100 text-amber-900", title: "Rider's last delivery attempt" });
  if (open) for (const f of flags) chips.push({ text: `⚑ ${RISK_LABEL[f] || f}`, cls: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200" });
  if (!chips.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {chips.map((c) => (
        <span key={c.text} title={c.title} className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10.5px] font-medium ${c.cls}`}>{c.text}</span>
      ))}
    </span>
  );
}
