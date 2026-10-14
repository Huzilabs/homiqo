import ProductImage from "./ProductImage";
import { formatDate, formatPrice } from "@/lib/format";
import type { TrackedOrder } from "@/lib/types";

export default function OrderDetails({ order }: { order: TrackedOrder }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-50 bg-cream/60 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">Order number</p>
          <p className="text-xl font-bold tracking-wide text-brand-700">{order.order_number}</p>
        </div>
        <div className="text-right text-sm text-ink/60">
          <p>Placed {formatDate(order.created_at)}</p>
          <p>Delivering to {order.city}</p>
        </div>
      </div>
      <ul className="divide-y divide-brand-50 px-6">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex items-center gap-4 py-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-cream">
              <ProductImage src={i.product_image} alt={i.product_name} sizes="64px" />
            </div>
            <p className="flex-1 text-sm font-medium">{i.product_name} <span className="text-ink/50">× {i.quantity}</span></p>
            <p className="text-sm font-semibold">{formatPrice(i.line_total)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-brand-50 px-6 py-5 text-sm">
        <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink/60">Delivery</dt><dd>{Number(order.shipping_fee) === 0 ? "Free" : formatPrice(order.shipping_fee)}</dd></div>
        <div className="flex justify-between pt-2 text-base font-bold text-brand-700"><dt>Total — pay on delivery</dt><dd>{formatPrice(order.total)}</dd></div>
      </dl>
    </div>
  );
}
