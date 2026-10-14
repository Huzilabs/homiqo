"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, ready, setQty, remove, subtotal, shipping, total } = useCart();
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
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="card divide-y">
          {items.map((i) => (
            <li key={i.product_id} className="flex gap-4 p-4 sm:p-5">
              <Link href={`/product/${i.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden bg-sand">
                <ProductImage src={i.image} alt={i.name} sizes="96px" />
              </Link>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <Link href={`/product/${i.slug}`} className="font-semibold hover:text-brand-700">{i.name}</Link>
                  <p className="text-sm text-ink/55">{formatPrice(i.price)} each</p>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center border">
                    <button className="p-2" onClick={() => setQty(i.product_id, i.quantity - 1)} aria-label="Decrease">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{i.quantity}</span>
                    <button className="p-2" onClick={() => setQty(i.product_id, i.quantity + 1)} aria-label="Increase">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="w-24 text-right font-bold">{formatPrice(i.price * i.quantity)}</p>
                  <button onClick={() => remove(i.product_id)} className="p-2 text-ink/40 hover:text-rose-600" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-2xl font-medium">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink/65">Subtotal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/65">Delivery</dt><dd className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="flex justify-between border-t pt-3 text-base font-bold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-6 w-full py-3.5 text-base">Proceed to checkout</Link>
          <Link href="/shop" className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
