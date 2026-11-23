import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck, Mail, PhoneCall, Truck } from "lucide-react";
import BankDetails from "@/components/BankDetails";
import OrderDetails from "@/components/OrderDetails";
import { createClient } from "@/lib/supabase/server";
import type { TrackedOrder } from "@/lib/types";
import { BANK, STORE } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { reviewLink } from "@/lib/reviews";
import { helpline } from "@/lib/delivery-guide";

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

      {order && order.status === "pending" && STORE.whatsapp && order.payment_method !== "bank_transfer" && (
        <div className="mx-auto mt-8 max-w-xl border border-[#25D366]/40 bg-[#25D366]/10 p-5 text-center">
          <p className="font-semibold text-ink">Confirm your order in one tap ✅</p>
          <p className="mt-1 text-sm text-ink/65">Send us a quick WhatsApp so we can confirm and dispatch your parcel faster.</p>
          <a
            href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
              `Assalam o Alaikum! I confirm my order ${order.order_number} — ${formatPrice(Number(order.total))} Cash on Delivery. Please dispatch it. — ${order.customer_name}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-12 items-center justify-center gap-2 bg-[#25D366] px-6 text-sm font-bold uppercase tracking-[.12em] text-white hover:bg-[#1ebe5b]"
          >
            Confirm on WhatsApp
          </a>
          <p className="mt-2 text-xs text-ink/50">or wait for our call on your number · {BANK.whatsappDisplay}</p>
        </div>
      )}

      {/* Before delivery: tell the customer what the rider may NOT ask for, and to call us instead of refusing */}
      {order && ["pending", "confirmed", "shipped"].includes(order.status) && (
        <div className="mx-auto mt-8 max-w-xl border-2 border-brand-600/30 bg-brand-50 p-5">
          <p className="font-semibold text-ink">🚚 Delivery guarantee — please read</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink/80">
            <li>✅ Delivery is <b>FREE</b> — we have already paid the courier.</li>
            <li>✅ Pay the rider only <b>{formatPrice(Number(order.total))}</b>{order.payment_method === "bank_transfer" ? " (Rs 0 if you paid by bank transfer)" : ""} — not one rupee more.</li>
            <li>✅ You can <b>open the parcel and check it</b> before paying.</li>
            <li>❌ If the rider asks for <b>extra money, delivery charges or an advance</b> — don't pay.</li>
            <li>❌ <b>Don't return the parcel.</b> Call or WhatsApp us first and we'll sort it out right away.</li>
          </ul>
          <p className="mt-3 text-sm text-ink/70" dir="rtl" lang="ur">ڈیلیوری مفت ہے۔ رائیڈر صرف آرڈر کی رقم لے گا — زیادہ پیسے یا ایڈوانس نہ دیں، پارسل واپس نہ کریں، پہلے ہمیں کال کریں۔</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${helpline().replace(/\s/g, "")}`} className="inline-flex h-11 items-center justify-center bg-ink px-5 text-sm font-semibold text-white">📞 Call {helpline()}</a>
            {STORE.whatsapp && (
              <a href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum, delivery ke baare mein baat karni hai. Order ${order.order_number}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center bg-[#25D366] px-5 text-sm font-semibold text-white">WhatsApp us</a>
            )}
          </div>
        </div>
      )}

      {/* Delivered: ask for a review right here (customers come back to this page to track their parcel) */}
      {order && order.status === "delivered" && phone && (
        <div className="mx-auto mt-8 max-w-xl border border-accent-500/40 bg-accent-50 p-5 text-center">
          <p className="text-2xl">⭐⭐⭐⭐⭐</p>
          <p className="mt-1 font-semibold text-ink">Your parcel was delivered — how did we do?</p>
          <p className="mt-1 text-sm text-ink/65">A quick review takes 30 seconds and helps other customers choose.</p>
          <a
            href={reviewLink(order.order_number, phone)}
            className="mt-4 inline-flex h-12 items-center justify-center gap-2 bg-accent-600 px-6 text-sm font-bold uppercase tracking-[.12em] text-white hover:bg-accent-700"
          >
            ★ Write a review
          </a>
        </div>
      )}

      {order?.payment_method === "bank_transfer" && (
        <div className="mt-10">
          <h2 className="text-center font-serif text-3xl font-medium">Complete your bank transfer</h2>
          <p className="mt-2 text-center text-sm text-ink/60">Transfer the amount below, then send us the screenshot on WhatsApp so we can dispatch your order.</p>
          <div className="mx-auto mt-6 max-w-xl"><BankDetails amount={Number(order.total)} orderNumber={order.order_number} /></div>
        </div>
      )}

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
