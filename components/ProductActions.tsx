"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
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
      <div className="mt-8 flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex h-[52px] items-center border border-ink/20">
            <button className="flex h-full w-12 items-center justify-center hover:bg-sand" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
              <Minus className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <span className="w-8 text-center text-sm font-medium" aria-live="polite">{qty}</span>
            <button className="flex h-full w-12 items-center justify-center hover:bg-sand" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Increase quantity">
              <Plus className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <button disabled={soldOut} onClick={() => add(product, qty)} className="btn-secondary h-[52px] flex-1">
            Add to cart
          </button>
        </div>
        <button disabled={soldOut} onClick={buyNow} className="btn-primary h-[56px] w-full">
          {soldOut ? "Sold out" : "Buy now — cash on delivery"}
        </button>
      </div>

      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-ink/10 bg-paper/95 px-5 py-3 backdrop-blur lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-lg leading-tight">{product.name}</p>
            <p className="text-sm text-ink/60">{formatPrice(product.price)}</p>
          </div>
          <button onClick={buyNow} className="btn-primary px-6 py-3.5">Buy now</button>
        </div>
      )}
    </>
  );
}
