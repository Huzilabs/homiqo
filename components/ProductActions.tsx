"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import { FREE_DELIVERY_MIN_ITEMS } from "@/lib/config";
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
        {!soldOut && (
          <p className={`text-sm ${qty >= FREE_DELIVERY_MIN_ITEMS ? "font-medium text-leaf-600" : "text-ink/65"}`}>
            {qty >= FREE_DELIVERY_MIN_ITEMS ? (
              "✓ FREE delivery on this order"
            ) : (
              <>
                🎁 Buy {FREE_DELIVERY_MIN_ITEMS} or more and get <b className="text-ink">FREE delivery</b>{" "}
                {max >= FREE_DELIVERY_MIN_ITEMS && (
                  <button type="button" onClick={() => setQty(FREE_DELIVERY_MIN_ITEMS)} className="font-medium text-brand-700 underline underline-offset-2">
                    make it {FREE_DELIVERY_MIN_ITEMS}
                  </button>
                )}
              </>
            )}
          </p>
        )}
        <button disabled={soldOut} onClick={buyNow} className="btn-primary h-[56px] w-full">
          {soldOut ? "Sold out" : "Buy now — cash on delivery"}
        </button>
      </div>

      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-ink/10 bg-paper/95 px-5 py-3 backdrop-blur lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-lg leading-tight">{product.name}</p>
            <p className="text-sm text-ink/60">
              {formatPrice(product.price)}
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="ml-2 text-xs text-ink/40 line-through">{formatPrice(product.compare_at_price)}</span>
              )}
              <span className="ml-2 text-[11px] text-leaf-600">· Cash on delivery</span>
            </p>
          </div>
          <button onClick={buyNow} className="btn-primary px-6 py-3.5">Buy now</button>
        </div>
      )}
    </>
  );
}
