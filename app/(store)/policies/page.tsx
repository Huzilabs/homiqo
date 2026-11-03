import type { Metadata } from "next";
import { BANK, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/config";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: "Homiqo delivery and returns policy: cash on delivery across Pakistan, 2–5 working day delivery, free delivery over Rs 5,000 and 7-day replacements.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesPage() {
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="font-serif text-4xl font-medium sm:text-5xl">Shipping & returns</h1>
      <div className="mt-8 space-y-8 leading-relaxed text-ink/75">
        <section>
          <h2 className="text-xl font-bold text-ink">Delivery</h2>
          <p className="mt-2">We deliver all over Pakistan. Orders are usually delivered within 2–5 working days. Delivery costs {formatPrice(SHIPPING_FEE)} for a single item, and is free when you order 2 or more items (any combination) or on orders of {formatPrice(FREE_SHIPPING_THRESHOLD)} or more.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Cash on Delivery</h2>
          <p className="mt-2">Pay the rider in cash when your parcel arrives. Our team may call you to confirm your order before dispatch.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Bank transfer</h2>
          <p className="mt-2">Prefer to pay in advance? Choose Bank Transfer at checkout to get {BANK.discountPct}% off your products (normal delivery charges apply). Transfer the amount to our {BANK.bank} account shown after you place the order, then send the payment screenshot on WhatsApp to {BANK.whatsappDisplay}. We dispatch once the payment is confirmed.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Returns & exchanges</h2>
          <p className="mt-2">If your item arrives damaged, faulty or not as described, contact us within 7 days of delivery and we’ll arrange a replacement or refund. Items must be unused and in original packaging.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">About our products</h2>
          <p className="mt-2">Homiqo is an online retailer. We do not manufacture any of our products ourselves — they are made by third-party manufacturers and suppliers that we source from, and we sell them under the Homiqo name. Our 7-day replacement or refund policy above applies to every product we sell.</p>
        </section>
      </div>
    </div>
  );
}
