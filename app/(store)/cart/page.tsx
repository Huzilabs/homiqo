"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { BANK, STORE } from "@/lib/config";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, ready, setQty, remove, subtotal, bundle, combo, shipping, total } = useCart();
  const tracked = useRef(false);

  useEffect(() => {
    if (ready && items.length && !tracked.current) {
      tracked.current = true;
      track.viewCart(items, subtotal);
    }
  }, [ready, items, subtotal]);

  if (!ready) return <div className="container-x py-20" />;

  if (items.length === 0) {
    return (
      <div className="container-x flex flex-col items-center py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-medium">Your cart is empty</h1>
        <p className="mt-2 text-ink/55">Looks like you haven’t added anything yet.</p>
        <Link href="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="font-serif text-4xl font-medium sm:text-5xl">Shopping cart</h1>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="card min-w-0 divide-y">
          {items.map((i) => (
            <li key={i.product_id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
              <Link href={`/product/${i.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden bg-white sm:h-24 sm:w-24">
                <ProductImage src={i.image} alt={i.name} sizes="96px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/product/${i.slug}`} className="line-clamp-2 break-words font-semibold leading-snug hover:text-brand-700">{i.name}</Link>
                    <p className="mt-1 text-sm text-ink/55">{formatPrice(i.price)} each</p>
                  </div>
                  <button onClick={() => remove(i.product_id)} className="-mr-2 -mt-1 shrink-0 p-2 text-ink/40 hover:text-rose-600 sm:hidden" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-6">
                  <div className="flex shrink-0 items-center border">
                    <button className="p-2" onClick={() => setQty(i.product_id, i.quantity - 1)} aria-label="Decrease">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{i.quantity}</span>
                    <button className="p-2" onClick={() => setQty(i.product_id, i.quantity + 1)} aria-label="Increase">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="whitespace-nowrap text-right font-bold sm:w-24">{formatPrice(i.price * i.quantity)}</p>
                  <button onClick={() => remove(i.product_id)} className="hidden p-2 text-ink/40 hover:text-rose-600 sm:block" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit min-w-0 p-5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl font-medium">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink/65">Subtotal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
            {combo > 0 && <div className="flex justify-between text-leaf-600"><dt>Combo deal saving</dt><dd className="font-medium">−{formatPrice(combo)}</dd></div>}
            {bundle > 0 && <div className="flex justify-between text-leaf-600"><dt>Buy 2 &amp; save</dt><dd className="font-medium">−{formatPrice(bundle)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink/65">Delivery</dt><dd className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="flex justify-between border-t pt-3 text-base font-bold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          {shipping > 0 && (
            <p className="mt-4 border border-accent-500/40 bg-accent-50 px-3 py-2.5 text-xs font-medium text-accent-700">
              Add 1 more item to get <b>free delivery</b> (save {formatPrice(shipping)})
            </p>
          )}
          <p className="mt-4 bg-leaf-100/60 px-3 py-2.5 text-xs text-ink/70">
            Pay cash on delivery — or save {BANK.discountPct}% with bank transfer at checkout.
          </p>
          <Link href="/checkout" className="btn-primary mt-4 w-full py-3.5 text-base">Proceed to checkout</Link>
          <Link href="/shop" className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline">Continue shopping</Link>
          {STORE.whatsapp && (
            <a href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Assalam o Alaikum, I have a question about my cart.")}`} target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-xs font-medium text-[#128C7E] hover:underline">
              Questions? Chat on WhatsApp
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
