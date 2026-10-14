"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Banknote, LoaderCircle, Lock } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"];

export default function CheckoutPage() {
  const { items, ready, subtotal, shipping, total, clear } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const placed = useRef(false);
  const tracked = useRef(false);

  useEffect(() => {
    if (ready && items.length && !tracked.current) {
      tracked.current = true;
      track.beginCheckout(items, subtotal);
    }
  }, [ready, items, subtotal]);

  useEffect(() => {
    if (ready && items.length === 0 && !placed.current) router.replace("/cart");
  }, [ready, items.length, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const customer = Object.fromEntries(
      ["customer_name", "phone", "email", "address", "city", "notes"].map((k) => [k, String(f.get(k) || "").trim()]),
    );
    setSubmitting(true);
    let data: { order_number: string; total: number; error?: string } | null = null;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) }),
      });
      data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not place your order. Please try again.");
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not place your order. Please try again.");
      return;
    }
    const { order_number, total: serverTotal } = data!;
    placed.current = true;
    track.purchase(order_number, items, Number(serverTotal), Number(serverTotal) - subtotal);
    try {
      sessionStorage.setItem("homecart.lastOrder", JSON.stringify({ order_number, phone: customer.phone }));
    } catch {}
    clear();
    router.push(`/order/${order_number}?phone=${encodeURIComponent(customer.phone)}`);
  }

  if (!ready || items.length === 0) return <div className="container-x py-20" />;

  return (
    <div className="container-x py-10">
      <h1 className="font-serif text-4xl font-medium sm:text-5xl">Checkout</h1>
      <form onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-serif text-2xl font-medium">Contact & delivery details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="customer_name" required autoComplete="name" className="sm:col-span-2" />
              <Field label="Phone number" name="phone" type="tel" required placeholder="03XX XXXXXXX" autoComplete="tel" pattern="[0-9+\-\s]{10,16}" />
              <Field label="Email (for order updates)" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
              <Field label="Complete address" name="address" required placeholder="House #, street, area" autoComplete="street-address" className="sm:col-span-2" />
              <div>
                <label className="label" htmlFor="city">City *</label>
                <input id="city" name="city" list="cities" required className="input" autoComplete="address-level2" />
                <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">Order notes (optional)</label>
                <textarea id="notes" name="notes" rows={3} className="input" placeholder="Landmark, preferred delivery time…" />
              </div>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="font-serif text-2xl font-medium">Payment</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 border-2 border-brand-500 bg-brand-50/50 p-4">
              <input type="radio" name="payment" defaultChecked className="mt-1 accent-brand-600" />
              <span>
                <span className="flex items-center gap-2 font-semibold"><Banknote className="h-5 w-5 text-brand-600" /> Cash on Delivery</span>
                <span className="mt-0.5 block text-sm text-ink/65">Pay in cash when your order is delivered.</span>
              </span>
            </label>
          </section>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl font-medium">Your order</h2>
          <ul className="mt-4 max-h-72 space-y-4 overflow-y-auto">
            {items.map((i) => (
              <li key={i.product_id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-sand">
                  <ProductImage src={i.image} alt={i.name} sizes="56px" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-800 px-1 text-[11px] font-bold text-white">{i.quantity}</span>
                </div>
                <p className="line-clamp-2 flex-1 text-sm font-medium">{i.name}</p>
                <p className="text-sm font-semibold">{formatPrice(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 border-t pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink/65">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/65">Delivery</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="flex justify-between border-t pt-3 text-base font-bold"><dt>Total (COD)</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          {error && <p className="mt-4 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-accent mt-5 w-full py-3.5 text-base">
            {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {submitting ? "Placing order…" : `Place order · ${formatPrice(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-ink/55">
            By placing your order you agree to our <Link href="/policies" className="underline">shipping & return policy</Link>.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, name, required, className = "", ...rest }: { label: string; name: string; required?: boolean; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}{required && " *"}</label>
      <input id={name} name={name} required={required} className="input" {...rest} />
    </div>
  );
}
