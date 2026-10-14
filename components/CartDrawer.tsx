"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/config";
import ProductImage from "./ProductImage";

export default function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, setQty, remove, subtotal } = useCart();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-serif text-2xl font-medium">Your cart</h2>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close cart" className="rounded-full p-1.5 hover:bg-sand">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <p className="font-semibold">Your cart is empty</p>
            <Link href="/shop" onClick={() => setDrawerOpen(false)} className="btn-primary">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b bg-brand-50/60 px-5 py-3 text-sm">
              {remaining > 0 ? (
                <p>
                  Add <b>{formatPrice(remaining)}</b> more for <b>free delivery</b>
                </p>
              ) : (
                <p className="font-medium text-brand-700">🎉 You’ve unlocked free delivery!</p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y overflow-y-auto px-5">
              {items.map((i) => (
                <li key={i.product_id} className="flex gap-4 py-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-sand">
                    <ProductImage src={i.image} alt={i.name} sizes="80px" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/product/${i.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="line-clamp-2 text-sm font-semibold hover:text-brand-700"
                    >
                      {i.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink/55">{formatPrice(i.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border">
                        <button className="p-1.5" onClick={() => setQty(i.product_id, i.quantity - 1)} aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{i.quantity}</span>
                        <button className="p-1.5" onClick={() => setQty(i.product_id, i.quantity + 1)} aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => remove(i.product_id)} className="p-1.5 text-ink/40 hover:text-rose-600" aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t p-5">
              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-ink/55">Delivery calculated at checkout. Pay cash when your order arrives.</p>
              <Link href="/checkout" onClick={() => setDrawerOpen(false)} className="btn-primary w-full">
                Checkout
              </Link>
              <Link href="/cart" onClick={() => setDrawerOpen(false)} className="btn-secondary w-full">
                View cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
