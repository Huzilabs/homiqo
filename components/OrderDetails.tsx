import { Check, Package, Truck, X } from "lucide-react";
import ProductImage from "./ProductImage";
import { formatDate, formatPrice, STATUS_LABEL } from "@/lib/format";
import type { TrackedOrder } from "@/lib/types";

const STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

export default function OrderDetails({ order }: { order: TrackedOrder }) {
  const cancelled = order.status === "cancelled";
  const reached = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const when = (s: string) => order.events.filter((e) => e.status === s).pop()?.created_at;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Order number</p>
            <p className="text-xl font-extrabold tracking-wide">{order.order_number}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Placed {formatDate(order.created_at)}</p>
            <p>Delivering to {order.city}</p>
          </div>
        </div>

        {cancelled ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-rose-700">
            <X className="h-5 w-5" /> This order has been cancelled.
          </div>
        ) : (
          <ol className="mt-8 grid grid-cols-4">
            {STEPS.map((s, i) => {
              const done = i <= reached;
              return (
                <li key={s} className="relative flex flex-col items-center text-center">
                  {i > 0 && (
                    <span className={`absolute right-1/2 top-4 h-1 w-full -translate-y-1/2 ${i <= reached ? "bg-brand-500" : "bg-gray-200"}`} />
                  )}
                  <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${done ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {s === "shipped" ? <Truck className="h-4 w-4" /> : s === "delivered" ? <Package className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </span>
                  <span className={`mt-2 text-xs font-semibold sm:text-sm ${done ? "text-ink" : "text-gray-400"}`}>{STATUS_LABEL[s]}</span>
                  {when(s) && <span className="hidden text-[11px] text-gray-500 sm:block">{formatDate(when(s)!)}</span>}
                </li>
              );
            })}
          </ol>
        )}

        {(order.courier || order.tracking_number) && (
          <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm">
            <p className="font-semibold text-brand-800">Shipment details</p>
            {order.courier && <p className="mt-1">Courier: <b>{order.courier}</b></p>}
            {order.tracking_number && <p>Tracking #: <b>{order.tracking_number}</b></p>}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-bold">Items</h2>
        <ul className="mt-4 divide-y">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                <ProductImage src={i.product_image} alt={i.product_name} sizes="56px" />
              </div>
              <p className="flex-1 text-sm font-medium">{i.product_name} <span className="text-gray-500">× {i.quantity}</span></p>
              <p className="text-sm font-semibold">{formatPrice(i.line_total)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd>{Number(order.shipping_fee) === 0 ? "Free" : formatPrice(order.shipping_fee)}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total — pay on delivery</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
