"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Banknote, Landmark, LoaderCircle, Lock } from "lucide-react";
import BankDetails from "@/components/BankDetails";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { BANK, STORE, bankDiscount } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

const POPULAR = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"];
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function CheckoutPage() {
  const { items, ready, subtotal, shipping: codShipping, clear } = useCart();
  const [payment, setPaymentState] = useState<"cod" | "bank_transfer">("cod");
  const setPayment = (p: "cod" | "bank_transfer") => {
    setPaymentState(p);
    track.addPaymentInfo(items, (p === "bank_transfer" ? subtotal - bankDiscount(subtotal) : subtotal) + codShipping, p);
  };
  const isBank = payment === "bank_transfer";
  // Must match public.place_order(): bank transfer = 5% off products; delivery follows the normal rule
  const discount = isBank ? bankDiscount(subtotal) : 0;
  const shipping = codShipping;
  const total = subtotal - discount + shipping;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const placed = useRef(false);
  const [cities, setCities] = useState<string[]>(POPULAR);

  useEffect(() => {
    createClient()
      .from("postex_cities")
      .select("name")
      .eq("is_delivery", true)
      .order("name")
      .then(({ data }) => {
        if (data?.length) setCities(Array.from(new Set([...POPULAR, ...data.map((c) => titleCase(c.name))])));
      });
  }, []);
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
    const customer: Record<string, string> = Object.fromEntries(
      ["customer_name", "phone", "email", "address", "city", "postal_code", "notes"].map((k) => [k, String(f.get(k) || "").trim()]),
    );
    customer.payment_method = payment;
    // Use the courier's spelling of the city so the parcel can be booked without edits
    const match = cities.find((c) => c.toLowerCase() === String(customer.city).toLowerCase());
    if (cities.length > POPULAR.length && !match) {
      setError("We couldn’t find that city. Please choose your city from the suggestions as you type.");
      return;
    }
    if (match) customer.city = match;
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
    track.purchase(order_number, items, Number(serverTotal), shipping, payment);
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
      <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-6">
            <h2 className="font-serif text-2xl font-medium">Contact & delivery details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="customer_name" required autoComplete="name" className="sm:col-span-2" />
              <div>
                <Field label="Phone number" name="phone" type="tel" required placeholder="03XX XXXXXXX" autoComplete="tel" inputMode="tel" pattern="[0-9+\-\s]{10,16}" />
                <p className="mt-1 text-xs text-ink/50">We’ll call this number to confirm your order.</p>
              </div>
              <div>
                <Field label="Email (optional)" name="email" type="email" autoComplete="email" placeholder="For order updates & tracking link" />
              </div>
              <Field label="Complete address" name="address" required placeholder="House #, street, area" autoComplete="street-address" className="sm:col-span-2" />
              <div>
                <label className="label" htmlFor="city">City *</label>
                <input id="city" name="city" list="cities" required className="input" autoComplete="address-level2" />
                <datalist id="cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="label" htmlFor="postal_code">Postal code</label>
                <input id="postal_code" name="postal_code" className="input" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} placeholder="e.g. 54000" title="5-digit postal code" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">Order notes (optional)</label>
                <textarea id="notes" name="notes" rows={3} className="input" placeholder="Landmark, preferred delivery time…" />
              </div>
            </div>
          </section>
          <section className="card p-6">
            <h2 className="font-serif text-2xl font-medium">Payment</h2>
            <div className="mt-4 space-y-3">
              <PayOption checked={!isBank} onSelect={() => setPayment("cod")} icon={<Banknote className="h-5 w-5 text-brand-600" />} title="Cash on Delivery" text="Pay in cash when your order is delivered." />
              <PayOption
                checked={isBank}
                onSelect={() => setPayment("bank_transfer")}
                icon={<Landmark className="h-5 w-5 text-brand-600" />}
                title="Bank Transfer"
                badge={`${BANK.discountPct}% OFF`}
                text={`Pay in advance to our ${BANK.bank} account and save ${BANK.discountPct}% on your products.`}
              />
            </div>
            {isBank && (
              <div className="mt-5">
                <BankDetails amount={total} />
                <p className="mt-3 text-xs text-ink/55">Place your order first — you’ll see your order number and these details again on the next page.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="card h-fit min-w-0 p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl font-medium">Your order</h2>
          <ul className="mt-4 max-h-72 space-y-4 overflow-y-auto">
            {items.map((i) => (
              <li key={i.product_id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-sand">
                  <ProductImage src={i.image} alt={i.name} sizes="56px" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-800 px-1 text-[11px] font-bold text-white">{i.quantity}</span>
                </div>
                <p className="line-clamp-2 min-w-0 flex-1 break-words text-sm font-medium">{i.name}</p>
                <p className="shrink-0 whitespace-nowrap text-sm font-semibold">{formatPrice(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 border-t pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink/65">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-leaf-600"><dt>Bank transfer discount ({BANK.discountPct}%)</dt><dd>−{formatPrice(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink/65">Delivery</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="flex justify-between border-t pt-3 text-base font-bold"><dt>{isBank ? "Total (bank transfer)" : "Total (COD)"}</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          {error && <p className="mt-4 bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-accent mt-5 w-full py-3.5 text-base">
            {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
            {submitting ? "Placing order…" : `Place order · ${formatPrice(total)}`}
          </button>
          <ul className="mt-4 space-y-1.5 text-xs text-ink/60">
            <li>✓ {isBank ? "Pay by bank transfer — details shown after you place the order" : "No advance payment — pay cash when the parcel arrives"}</li>
            <li>✓ We call to confirm before dispatch · delivered in 2–5 working days</li>
            <li>✓ Damaged or faulty? Replacement or refund within 7 days</li>
          </ul>
          {STORE.whatsapp && (
            <a href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Assalam o Alaikum, I need help placing an order.")}`} target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-xs font-medium text-[#128C7E] hover:underline">
              Need help? Order on WhatsApp
            </a>
          )}
          <p className="mt-3 text-center text-xs text-ink/55">
            By placing your order you agree to our <Link href="/policies" className="underline">shipping & return policy</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
          </p>
        </aside>
      </form>
    </div>
  );
}

function PayOption({ checked, onSelect, icon, title, text, badge }: { checked: boolean; onSelect: () => void; icon: React.ReactNode; title: string; text: string; badge?: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 border-2 p-4 transition ${checked ? "border-brand-500 bg-brand-50/50" : "border-ink/10 hover:border-ink/30"}`}>
      <input type="radio" name="payment" checked={checked} onChange={onSelect} className="mt-1 accent-brand-600" />
      <span className="flex-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          {icon} {title}
          {badge && <span className="bg-accent-600 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-white">{badge}</span>}
        </span>
        <span className="mt-0.5 block text-sm text-ink/65">{text}</span>
      </span>
    </label>
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
