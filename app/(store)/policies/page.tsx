import type { Metadata } from "next";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/config";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Shipping & returns" };

export default function PoliciesPage() {
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Shipping & returns</h1>
      <div className="mt-8 space-y-8 leading-relaxed text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-ink">Delivery</h2>
          <p className="mt-2">We deliver all over Pakistan. Orders are usually delivered within 2–5 working days. Delivery costs {formatPrice(SHIPPING_FEE)}, and is free on orders of {formatPrice(FREE_SHIPPING_THRESHOLD)} or more.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Cash on Delivery</h2>
          <p className="mt-2">Pay the rider in cash when your parcel arrives. Our team may call you to confirm your order before dispatch.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Returns & exchanges</h2>
          <p className="mt-2">If your item arrives damaged, faulty or not as described, contact us within 7 days of delivery and we’ll arrange a replacement or refund. Items must be unused and in original packaging.</p>
        </section>
      </div>
    </div>
  );
}
