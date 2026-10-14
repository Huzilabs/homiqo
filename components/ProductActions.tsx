"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductActions({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;
  const max = Math.min(product.stock, 20);

  useEffect(() => {
    track.viewItem(product);
  }, [product]);

  const buyNow = () => {
    add(product, qty, false);
    router.push("/checkout");
  };

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex h-12 items-center rounded-full border border-gray-200 bg-white">
          <button className="px-3.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
          <button className="px-3.5" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button disabled={soldOut} onClick={() => add(product, qty)} className="btn-secondary h-12 flex-1 sm:flex-none">
          <ShoppingBag className="h-4 w-4" /> Add to cart
        </button>
        <button disabled={soldOut} onClick={buyNow} className="btn-accent h-12 w-full sm:w-auto sm:flex-1">
          <Zap className="h-4 w-4" /> {soldOut ? "Sold out" : "Buy now — Cash on Delivery"}
        </button>
      </div>

      {/* Sticky mobile buy bar */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-sm font-bold text-brand-700">{formatPrice(product.price)}</p>
          </div>
          <button onClick={buyNow} className="btn-accent px-5">
            Buy now
          </button>
        </div>
      )}
    </>
  );
}
