import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import OrderDetails from "@/components/OrderDetails";
import { createClient } from "@/lib/supabase/server";
import type { TrackedOrder } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { number } = await params;
  const { phone } = await searchParams;
  let order: TrackedOrder | null = null;
  if (phone) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("track_order", { p_order_number: number, p_phone: phone });
    order = data as TrackedOrder | null;
  }

  return (
    <div className="container-x max-w-3xl py-12">
      <div className="text-center">
        <CircleCheck className="mx-auto h-16 w-16 text-brand-600" strokeWidth={1.5} />
        <h1 className="mt-4 text-3xl font-extrabold">Thank you for your order!</h1>
        <p className="mt-2 text-gray-600">
          Your order <b>{number}</b> has been received. We’ll call you shortly to confirm it.
        </p>
        <p className="mt-1 text-sm text-gray-500">Save your order number — you can use it to track your delivery.</p>
      </div>
      <div className="mt-10">
        {order ? (
          <OrderDetails order={order} />
        ) : (
          <p className="card p-6 text-center text-gray-600">
            You can view your order status any time on the <Link href="/track" className="font-semibold text-brand-700 underline">tracking page</Link>.
          </p>
        )}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">Continue shopping</Link>
        <Link href={`/track?order=${number}`} className="btn-secondary">Track order</Link>
      </div>
    </div>
  );
}
