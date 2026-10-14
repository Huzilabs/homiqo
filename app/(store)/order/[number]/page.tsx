import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck, Mail, PhoneCall, Truck } from "lucide-react";
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
    <div className="container-x max-w-3xl py-14">
      <div className="text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
          <CircleCheck className="h-11 w-11" strokeWidth={1.75} />
        </span>
        <h1 className="mt-6 font-serif text-4xl font-medium sm:text-5xl">Thank you{order ? `, ${order.customer_name.split(" ")[0]}` : ""}!</h1>
        <p className="mt-3 text-ink/70">
          Your order <b className="text-brand-700">{number}</b> has been placed successfully.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Mail, t: "Check your email", d: "We’ve sent your order details." },
          { icon: PhoneCall, t: "We’ll confirm", d: "Our team will call or email to confirm." },
          { icon: Truck, t: "Fast dispatch", d: "Delivered in 2–5 working days." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className=" bg-white p-5 text-center  ring-1 ring-brand-50">
            <Icon className="mx-auto h-6 w-6 text-accent-500" />
            <p className="mt-2 font-semibold text-brand-700">{t}</p>
            <p className="text-xs text-ink/60">{d}</p>
          </div>
        ))}
      </div>

      {order && <div className="mt-8"><OrderDetails order={order} /></div>}

      <div className="mt-10 flex justify-center">
        <Link href="/shop" className="btn-primary px-8">Continue shopping</Link>
      </div>
    </div>
  );
}
