"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Lock, Minus, Plus, X } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { FLASH_OFFER, STORE, flashDiscount } from "@/lib/config";
import { claimFlash, markFlashUsed, mmss, useFlashOffer } from "@/lib/flash";
import { createClient } from "@/lib/supabase/client";
import { clearLead, saveLead } from "@/lib/checkout-lead";
import { PK_MOBILE_PATTERN } from "@/lib/phone";
import { sendVisitEvent } from "@/lib/visits";
import type { CartItem, Product } from "@/lib/types";

const POPULAR = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad"];
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const norm = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");
const SAVED_KEY = "hq.customer";
const remember = (form: HTMLFormElement) => {
  try {
    const f = new FormData(form);
    const v = Object.fromEntries(["customer_name", "phone", "city", "address"].map((k) => [k, String(f.get(k) || "").trim()]));
    if (Object.values(v).some(Boolean)) localStorage.setItem(SAVED_KEY, JSON.stringify(v));
  } catch {}
};

/**
 * One-step order form that slides up on the product page (cash on delivery).
 * Same order path as /checkout: POST /api/checkout → place_order(), with lead saving, the Meta offer and tracking.
 */
export default function QuickOrder({ product, initialQty, onClose }: { product: Product; initialQty: number; onClose: () => void }) {
  const router = useRouter();
  const max = Math.max(1, Math.min(product.stock, 20));
  const [qty, setQty] = useState(Math.min(initialQty, max));
  const [cities, setCities] = useState<string[]>(POPULAR);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { offer, msLeft } = useFlashOffer();
  const leadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const price = Number(product.price);
  const bundleSave = Number(product.bundle_save || 0);
  const subtotal = price * qty;
  const bundle = Math.floor(qty / 2) * bundleSave;
  const offerDiscount = offer?.claimed ? flashDiscount(subtotal) : 0;
  const total = subtotal - bundle - offerDiscount;
  const item: CartItem = { product_id: product.id, slug: product.slug, name: product.name, price, image: product.images[0] || null, quantity: qty, stock: product.stock, bundle_save: bundleSave };

  // Opening the form counts as reaching checkout (Meta InitiateCheckout + the 2-minute offer is locked in)
  useEffect(() => {
    track.beginCheckout([item], subtotal - bundle);
    claimFlash();
    createClient()
      .from("postex_cities")
      .select("name")
      .eq("is_delivery", true)
      .order("name")
      .then(({ data }) => {
        if (data?.length) setCities(Array.from(new Set([...POPULAR, ...data.map((c) => titleCase(c.name))])));
      });
    // lock page scroll behind the sheet; Esc closes
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // returning visitor: fill in the details they typed before (saved on this phone only)
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || "null") as Record<string, string> | null;
      if (saved) {
        for (const k of ["customer_name", "phone", "city", "address"]) {
          const el = dialog.current?.querySelector<HTMLInputElement>(`input[name=${k}]`);
          if (el && !el.value && saved[k]) el.value = saved[k];
        }
      }
    } catch {}
    dialog.current?.querySelector<HTMLInputElement>("input[name=customer_name]")?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    if (leadTimer.current) clearTimeout(leadTimer.current);
    leadTimer.current = setTimeout(() => { saveLead(form, [item], subtotal); remember(form); }, 1200);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    remember(e.currentTarget);
    const f = new FormData(e.currentTarget);
    const customer: Record<string, string> = Object.fromEntries(
      ["customer_name", "phone", "address", "city", "notes"].map((k) => [k, String(f.get(k) || "").trim()]),
    );
    customer.payment_method = "cod";
    if (offer?.claimed) customer.flash_offer = offer.id;
    const typed = norm(customer.city);
    const match = cities.find((c) => norm(c) === typed) || (typed.length >= 4 ? cities.find((c) => norm(c).startsWith(typed) || typed.startsWith(norm(c))) : undefined);
    customer.city = match || titleCase(customer.city);
    setSubmitting(true);
    let data: { order_number: string; total: number; error?: string } | null = null;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items: [{ product_id: product.id, quantity: qty }] }),
      });
      data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not place your order. Please try again.");
    } catch (err) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "Could not place your order. Please try again.";
      setError(msg);
      sendVisitEvent("checkout_error", { label: msg });
      return;
    }
    const { order_number, total: serverTotal } = data!;
    if (leadTimer.current) clearTimeout(leadTimer.current);
    clearLead();
    track.purchase(order_number, [item], Number(serverTotal), 0, "cod");
    try {
      sessionStorage.setItem("homecart.lastOrder", JSON.stringify({ order_number, phone: customer.phone }));
    } catch {}
    if (offer) markFlashUsed();
    router.push(`/order/${order_number}?phone=${encodeURIComponent(customer.phone)}`);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 lg:items-center" onClick={onClose} role="presentation">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${product.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92svh] w-full flex-col overflow-hidden bg-paper shadow-2xl lg:max-w-lg"
      >
        {/* header: product, quantity and total stay visible */}
        <div className="flex items-start gap-3 border-b border-ink/10 p-4">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden bg-sand">
            <ProductImage src={product.images[0]} alt={product.name} sizes="64px" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{product.name}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-9 items-center border border-ink/20">
                <button type="button" className="flex h-full w-9 items-center justify-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="h-3.5 w-3.5" /></button>
                <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
                <button type="button" className="flex h-full w-9 items-center justify-center" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Increase quantity"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <span className="whitespace-nowrap text-lg font-bold text-accent-700">{formatPrice(total)}</span>
              {total < subtotal && <span className="whitespace-nowrap text-xs text-ink/40 line-through">{formatPrice(subtotal)}</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 p-2 text-ink/50 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>

        <form
          onSubmit={onSubmit}
          onChange={onFormChange}
          onBlur={onFormChange}
          onInvalidCapture={(e) => sendVisitEvent("checkout_error", { label: `quick form invalid field: ${(e.target as HTMLInputElement).name}` })}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {bundleSave > 0 && max >= 2 && (
              qty >= 2 ? (
                <p className="bg-leaf-100 px-3 py-2 text-sm font-medium text-leaf-600">✓ Buy 2 deal: you save {formatPrice(bundle)}</p>
              ) : (
                <button type="button" onClick={() => setQty(2)} className="w-full border border-accent-500/40 bg-accent-50 px-3 py-2 text-left text-sm">
                  🎁 <b className="text-accent-700">Buy 2, save {formatPrice(bundleSave)}</b> — tap to make it 2 for {formatPrice(price * 2 - bundleSave)}
                </button>
              )
            )}
            {offerDiscount > 0 && (
              <p className="bg-accent-50 px-3 py-2 text-sm text-accent-700">⚡ Extra {FLASH_OFFER.pct}% off applied (−{formatPrice(offerDiscount)}) · {mmss(msLeft)} left</p>
            )}

            <p className="text-sm font-semibold">Delivery details</p>
            <div>
              <label className="label" htmlFor="qo-name">Full name *</label>
              <input id="qo-name" name="customer_name" required autoComplete="name" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="qo-phone">Phone number *</label>
              <input id="qo-phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" pattern={PK_MOBILE_PATTERN} title="Enter a complete mobile number, e.g. 0300 1234567" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="qo-city">City *</label>
              <input id="qo-city" name="city" list="qo-cities" required autoComplete="address-level2" placeholder="Start typing your city" className="input" />
              <datalist id="qo-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="label" htmlFor="qo-address">Complete address *</label>
              <input id="qo-address" name="address" required autoComplete="street-address" placeholder="House #, street, area / block, landmark" className="input" />
            </div>
            <ul className="space-y-1 pt-1 text-xs text-ink/65">
              <li>🚚 Free delivery all over Pakistan · 2–5 working days</li>
              <li>💵 Cash on delivery — open the parcel and check it, then pay</li>
              <li>🔁 7-day replacement if damaged or faulty</li>
            </ul>
          </div>

          <div className="border-t border-ink/10 bg-paper p-3">
            {error && <p className="mb-2 bg-rose-50 p-2 text-xs text-rose-700" role="alert">{error}</p>}
            <p className="mb-2 text-center text-[12.5px] font-semibold text-leaf-600">✓ No advance payment · Pay when you receive</p>
            <button type="submit" disabled={submitting} className="flex h-14 w-full items-center justify-center gap-2 bg-accent-600 text-white shadow-lift active:bg-accent-700 disabled:opacity-70">
              {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
              <span className="text-[15px] font-bold uppercase tracking-[.1em]">{submitting ? "Placing order…" : `Place order · ${formatPrice(total)}`}</span>
            </button>
            {STORE.whatsapp && (
              <a href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum! I want to order: ${product.name} (x${qty})`)}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center text-xs font-medium text-[#128C7E]">
                Prefer WhatsApp? Order on chat →
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
