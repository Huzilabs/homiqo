"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { STORE } from "@/lib/config";

export default function ProductActions({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;
  const max = Math.min(product.stock, 20);
  const bundleSave = Number(product.bundle_save || 0);
  const lineTotal = Number(product.price) * qty - Math.floor(qty / 2) * bundleSave;

  useEffect(() => {
    track.viewItem(product);
  }, [product]);

  // Lets the floating WhatsApp button mention this product
  useEffect(() => {
    const w = window as unknown as { __hqProduct?: { name: string; price: string; url: string } };
    w.__hqProduct = { name: product.name, price: formatPrice(product.price), url: `${STORE.siteUrl.replace(/\/$/, "")}/product/${product.slug}` };
    return () => {
      delete w.__hqProduct;
    };
  }, [product]);

  const waHref = () => {
    const url = `${STORE.siteUrl.replace(/\/$/, "")}/product/${product.slug}`;
    const msg =
      `Assalam o Alaikum! I want to order:\n\n` +
      `*${product.name}*\nQuantity: ${qty}\nPrice: ${formatPrice(lineTotal)} (free delivery, cash on delivery)\n${url}\n\n` +
      `My name:\nPhone:\nFull address:\nCity:`;
    return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

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
          <p className="text-sm font-medium text-leaf-600">🚚 FREE delivery on this order — anywhere in Pakistan</p>
        )}
        {!soldOut && bundleSave > 0 && max >= 2 && (
          <div className="flex items-center justify-between gap-3 border border-accent-500/40 bg-accent-50 px-4 py-3 text-sm">
            {qty >= 2 ? (
              <p className="font-medium text-accent-700">
                ✓ You save {formatPrice(Math.floor(qty / 2) * bundleSave)} — {qty} for {formatPrice(lineTotal)}
              </p>
            ) : (
              <>
                <p className="text-ink/80">
                  🎁 <b className="text-accent-700">Buy 2, save {formatPrice(bundleSave)}</b> — 2 for {formatPrice(Number(product.price) * 2 - bundleSave)}
                </p>
                <button type="button" onClick={() => setQty(2)} className="shrink-0 bg-accent-600 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-white hover:bg-accent-700">
                  Get 2
                </button>
              </>
            )}
          </div>
        )}
        <button disabled={soldOut} onClick={buyNow} className="btn-primary h-[56px] w-full">
          {soldOut ? "Sold out" : "Buy now — cash on delivery"}
        </button>
        {!soldOut && STORE.whatsapp && (
          <a
            href={waHref()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track.whatsappOrder(product, qty)}
            className="flex h-[52px] w-full items-center justify-center gap-2.5 bg-[#25D366] text-[13px] font-semibold uppercase tracking-[.18em] text-white transition hover:bg-[#1ebe5b]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.28l5.68-1.49a11.3 11.3 0 0 0 5.43 1.38h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.32-8.02"/></svg>
            Order on WhatsApp
          </a>
        )}
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
