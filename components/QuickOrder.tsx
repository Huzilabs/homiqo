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
import { isPkMobile, normalizePkMobile } from "@/lib/phone";
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
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [addon, setAddon] = useState<Product | null>(null);
  const [addOn, setAddOn] = useState(false);
  const { offer, msLeft } = useFlashOffer();
  const leadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const price = Number(product.price);
  const bundleSave = Number(product.bundle_save || 0);
  // add-on price: the special order-form price (e.g. knife sharpener Rs 550) when one is set
  const addonUnit = addon ? Number(addon.addon_price || addon.price) : 0;
  const addonPrice = addOn && addon ? addonUnit : 0;
  const subtotal = price * qty + addonPrice;
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
    // one-tap add-on: a low-priced best-fit extra (cheapest other in-stock product)
    createClient()
      .from("products")
      .select("id, name, slug, price, compare_at_price, addon_price, images, stock, bundle_save, components, category")
      .eq("is_active", true)
      .gt("stock", 0)
      .neq("id", product.id)
      .lte("price", 1300)
      .order("price")
      .limit(8)
      .then(({ data }) => {
        const list = ((data || []) as Product[]).filter((p) => !(p.components || []).length);
        // a product with a special add-on price wins; otherwise the cheapest one, same category first
        setAddon(list.find((p) => Number(p.addon_price) > 0) || list.find((p) => p.category === product.category) || list[0] || null);
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
    // friendly checks shown under each field (instead of the browser's popups)
    const errs: Record<string, string> = {};
    if (customer.customer_name.length < 2) errs.customer_name = "Please write your name";
    if (!customer.phone) errs.phone = "Please write your mobile number";
    else if (!isPkMobile(customer.phone)) errs.phone = "This number looks incomplete — e.g. 0300 1234567";
    if (customer.city.length < 2) errs.city = "Please write your city";
    if (customer.address.length < 8) errs.address = "Please add your house / street number and area";
    setFieldErr(errs);
    if (Object.keys(errs).length) {
      sendVisitEvent("checkout_error", { label: `quick form: ${Object.keys(errs).join(", ")}` });
      dialog.current?.querySelector<HTMLInputElement>(`[name=${Object.keys(errs)[0]}]`)?.focus();
      return;
    }
    customer.phone = normalizePkMobile(customer.phone);
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
        body: JSON.stringify({ customer, items: [{ product_id: product.id, quantity: qty }, ...(addOn && addon ? [{ product_id: addon.id, quantity: 1, addon: true }] : [])] }),
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
    track.purchase(order_number, addOn && addon ? [item, { product_id: addon.id, slug: addon.slug, name: addon.name, price: addonUnit, image: addon.images[0] || null, quantity: 1, stock: addon.stock, bundle_save: Number(addon.bundle_save || 0) }] : [item], Number(serverTotal), 0, "cod");
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
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {bundleSave > 0 && max >= 2 && (
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Quantity deal">
                {[1, 2].map((n) => {
                  const on = n === 1 ? qty === 1 : qty >= 2;
                  return (
                    <button key={n} type="button" role="radio" aria-checked={on} onClick={() => setQty(n)}
                      className={`relative rounded border px-3 py-2.5 text-left transition ${on ? "border-accent-600 bg-accent-50 ring-1 ring-accent-600" : "border-ink/15 bg-white"}`}>
                      {n === 2 && <span className="absolute -top-2 right-2 rounded-sm bg-leaf-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">SAVE {formatPrice(bundleSave)}</span>}
                      <span className="block text-[12.5px] text-ink/60">{n === 1 ? "Buy 1" : "Make it 2"}</span>
                      <span className="block text-[15px] font-semibold">{formatPrice(price * n - (n === 2 ? bundleSave : 0))}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {offerDiscount > 0 && (
              <p className="bg-accent-50 px-3 py-2 text-sm text-accent-700">⚡ Extra {FLASH_OFFER.pct}% off applied (−{formatPrice(offerDiscount)}) · {mmss(msLeft)} left</p>
            )}

            <p className="text-sm font-semibold">Delivery details</p>
            <div>
              <label className="label" htmlFor="qo-name">Full name *</label>
              <input id="qo-name" name="customer_name" autoComplete="name" aria-invalid={!!fieldErr.customer_name} className={`input ${fieldErr.customer_name ? "border-rose-500" : ""}`} />
              {fieldErr.customer_name && <p className="mt-1 text-xs font-medium text-rose-600">{fieldErr.customer_name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="qo-phone">Phone number *</label>
              <input id="qo-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" aria-invalid={!!fieldErr.phone}
                onBlur={(e) => { if (isPkMobile(e.target.value)) e.target.value = normalizePkMobile(e.target.value); }}
                className={`input ${fieldErr.phone ? "border-rose-500" : ""}`} />
              {fieldErr.phone && <p className="mt-1 text-xs font-medium text-rose-600">{fieldErr.phone}</p>}
            </div>
            <div>
              <label className="label" htmlFor="qo-city">City *</label>
              <input id="qo-city" name="city" list="qo-cities" autoComplete="address-level2" placeholder="Start typing your city" aria-invalid={!!fieldErr.city} className={`input ${fieldErr.city ? "border-rose-500" : ""}`} />
              {fieldErr.city && <p className="mt-1 text-xs font-medium text-rose-600">{fieldErr.city}</p>}
              <datalist id="qo-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="label" htmlFor="qo-address">Complete address *</label>
              <input id="qo-address" name="address" autoComplete="street-address" placeholder="House #, street, area / block, landmark" aria-invalid={!!fieldErr.address} className={`input ${fieldErr.address ? "border-rose-500" : ""}`} />
              {fieldErr.address && <p className="mt-1 text-xs font-medium text-rose-600">{fieldErr.address}</p>}
            </div>
            {addon && (
              <label className={`flex cursor-pointer items-center gap-3 rounded border px-3 py-2.5 transition ${addOn ? "border-accent-600 bg-accent-50" : "border-dashed border-ink/25 bg-white"}`}>
                <input type="checkbox" checked={addOn} onChange={(e) => setAddOn(e.target.checked)} className="h-5 w-5 shrink-0 accent-accent-600" />
                <span className="relative h-11 w-11 shrink-0 overflow-hidden bg-sand"><ProductImage src={addon.images[0]} alt={addon.name} sizes="44px" /></span>
                <span className="min-w-0 flex-1 text-[13px] leading-snug">
                  <span className="block font-semibold text-ink">Add {addon.name}</span>
                  {addonUnit < Number(addon.price) ? (
                    <span className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="font-bold text-accent-700">+{formatPrice(addonUnit)}</span>
                      <s className="text-ink/45">{formatPrice(Math.max(Number(addon.price), Number(addon.compare_at_price || 0)))}</s>
                      <span className="rounded-sm bg-rose-600 px-1 text-[10.5px] font-bold text-white">Save {formatPrice(Math.max(Number(addon.price), Number(addon.compare_at_price || 0)) - addonUnit)}</span>
                      <span className="w-full text-ink/60">Only with this order · same parcel, free delivery</span>
                    </span>
                  ) : (
                    <span className="text-ink/60">+{formatPrice(addon.price)} · same parcel, free delivery</span>
                  )}
                </span>
              </label>
            )}
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
