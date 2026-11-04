import type { Metadata } from "next";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import ReviewForm from "@/components/ReviewForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review your order", robots: { index: false, follow: false } };

type Item = { product_id: string; product_name: string; product_image: string | null; reviewed: boolean };
type Data = { order_number: string; customer_name: string; city: string; status: string; items: Item[] } | null;

export default async function ReviewPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ phone?: string }> }) {
  const { number } = await params;
  const { phone = "" } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("review_order", { p_order_number: number, p_phone: phone });
  const order = data as Data;

  return (
    <div className="container-x max-w-2xl py-14">
      <h1 className="font-serif text-4xl font-medium sm:text-5xl">Review your order</h1>
      {!order ? (
        <p className="mt-6 text-ink/70">We couldn’t find this order. Please use the review link we sent you, or <Link href="/contact" className="underline">contact us</Link>.</p>
      ) : order.status !== "delivered" ? (
        <p className="mt-6 text-ink/70">Thanks, {order.customer_name.split(" ")[0]}! You can review order <b>{order.order_number}</b> once it has been delivered.</p>
      ) : (
        <>
          <p className="mt-4 text-ink/70">
            Hi {order.customer_name.split(" ")[0]}, thank you for ordering from us! How was your order <b>{order.order_number}</b>? Your honest review helps other customers.
          </p>
          <div className="mt-10 space-y-10">
            {order.items.map((it) => (
              <section key={it.product_id} className="card p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-4">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden border border-ink/5 bg-white">
                    <ProductImage src={it.product_image} alt={it.product_name} sizes="64px" />
                  </span>
                  <h2 className="font-serif text-2xl font-medium">{it.product_name}</h2>
                </div>
                {it.reviewed ? (
                  <p className="text-sm text-ink/60">You’ve already reviewed this product — thank you!</p>
                ) : (
                  <ReviewForm orderNumber={order.order_number} phone={phone} productId={it.product_id} productName={it.product_name} defaultName={order.customer_name.split(" ")[0]} />
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
