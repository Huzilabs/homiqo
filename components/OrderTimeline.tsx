import { Check, PhoneCall, Truck } from "lucide-react";
import type { TrackedOrder } from "@/lib/types";
import { helpline } from "@/lib/delivery-guide";

/** Placed → Confirmed → With courier → Delivered, with the live PostEx status and the helpline. */
export default function OrderTimeline({ order }: { order: TrackedOrder }) {
  const ps = order.postex_status || "";
  const cancelled = order.status === "cancelled";
  const returning = /^return/i.test(ps);
  const withCourier = order.status === "shipped" || order.status === "delivered" || /picked|warehouse|en-?route|departed|arrived|attempt|transit/i.test(ps);
  const steps = [
    { label: "Order placed", done: true },
    { label: "Confirmed", done: ["confirmed", "shipped", "delivered"].includes(order.status) },
    { label: "With courier", done: withCourier },
    { label: "Delivered", done: order.status === "delivered" },
  ];
  const current = steps.findIndex((s) => !s.done);
  const problem = order.postex_attempt_reason && withCourier && order.status !== "delivered" && !returning;

  return (
    <div className="mx-auto mt-8 max-w-xl border border-ink/10 bg-white p-5">
      <p className="text-[15px] font-semibold text-ink">Order status</p>
      {cancelled ? (
        <p className="mt-3 rounded bg-rose-50 p-3 text-sm text-rose-800">This order was cancelled.</p>
      ) : (
        <ol className="mt-4 grid grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.label} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${s.done ? "bg-leaf-600" : "bg-ink/10"}`} aria-hidden />}
              <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${s.done ? "bg-leaf-600 text-white" : i === current ? "border-2 border-accent-600 bg-white text-accent-700" : "border-2 border-ink/15 bg-white text-ink/40"}`}>
                {s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`mt-1.5 text-[11.5px] leading-tight ${s.done || i === current ? "font-semibold text-ink" : "text-ink/45"}`}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}
      {order.tracking_number && !cancelled && (
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink/70">
          <Truck className="h-4 w-4 text-brand-600" /> {order.courier || "PostEx"} · <span className="font-mono">{order.tracking_number}</span>
          {ps && <span className="text-ink/55">· {ps}</span>}
        </p>
      )}
      {problem && (
        <p className="mt-3 rounded bg-amber-50 p-3 text-[13px] text-amber-900">
          The rider couldn&apos;t deliver yet (<b>{order.postex_attempt_reason}</b>). Please call us so we can arrange delivery again — don&apos;t worry, you don&apos;t pay anything extra.
        </p>
      )}
      {!cancelled && order.status !== "delivered" && (
        <a href={`tel:${helpline().replace(/\s/g, "")}`} className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded bg-ink px-5 text-sm font-semibold text-white">
          <PhoneCall className="h-4 w-4" /> Questions about delivery? Call {helpline()}
        </a>
      )}
    </div>
  );
}
