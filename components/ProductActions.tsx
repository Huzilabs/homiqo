"use client";
import { useRouter } from "next/navigation";
import { adRefNote } from "@/lib/ad-ref";
import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/analytics";
import { sendVisitEvent } from "@/lib/visits";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { STORE } from "@/lib/config";
import QuickOrder from "@/components/QuickOrder";
import { quickOrderVariant } from "@/lib/ab";
import { BUY_NOW_EVENT } from "./FlashOfferPopup";

export default function ProductActions({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [quick, setQuick] = useState(false);
  const soldOut = product.stock <= 0;
  const max = Math.min(product.stock, 20);
  const bundleSave = Number(product.bundle_save || 0);
  const lineTotal = Number(product.price) * qty - Math.floor(qty / 2) * bundleSave;

  useEffect(() => {
    track.viewItem(product);
  }, [product]);

  // Engagement: did they stay 10s / 30s and scroll half the page? (tells us "left instantly" vs "read and left")
  useEffect(() => {
    const t1 = setTimeout(() => sendVisitEvent("engaged_10s", { pid: product.id }), 10000);
    const t2 = setTimeout(() => sendVisitEvent("engaged_30s", { pid: product.id }), 30000);
    let scrolled = false;
    const onScroll = () => {
      if (scrolled) return;
      const h = document.documentElement;
      if ((h.scrollTop + window.innerHeight) / h.scrollHeight > 0.5) {
        scrolled = true;
        sendVisitEvent("scroll_50", { pid: product.id });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", onScroll);
    };
  }, [product.id]);

  // Lets the floating WhatsApp button mention this product
  useEffect(() => {
    const w = window as unknown as { __hqProduct?: { name: string; price: string; url: string } };
    w.__hqProduct = { name: product.name, price: formatPrice(product.price), url: `${STORE.siteUrl.replace(/\/$/, "")}/product/${product.slug}` };
    return () => {
      delete w.__hqProduct;
    };
  }, [product]);

  const waHref = (withRef = false) => {
    const url = `${STORE.siteUrl.replace(/\/$/, "")}/product/${product.slug}`;
    const msg =
      `Assalam o Alaikum! I want to order:\n\n` +
      `*${product.name}*\nQuantity: ${qty}\nPrice: ${formatPrice(lineTotal)} (free delivery, cash on delivery)\n${url}\n\n` +
      `My name:\nPhone:\nFull address:\nCity:` +
      (withRef ? adRefNote() : ""); // the ad reference is read from localStorage, so only add it on click (not during render)
    return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  const buyNow = () => {
    // 50/50 test: half of visitors order in a form on this page, half go to the checkout page
    if (quickOrderVariant() === "sheet") {
      track.addToCart(product, qty);
      setQuick(true);
      return;
    }
    add(product, qty, false);
    router.push("/checkout");
  };
  // "Order now" in the Meta offer popup opens the same order form
  useEffect(() => {
    const onBuy = () => !soldOut && buyNow();
    window.addEventListener(BUY_NOW_EVENT, onBuy);
    return () => window.removeEventListener(BUY_NOW_EVENT, onBuy);
  });


  return (
    <>
      <div className="mt-3 flex flex-col gap-3">
        {/* Choose your deal (Buy 1 / Buy 2) — or a plain quantity stepper for products without a Buy-2 saving */}
        {!soldOut && bundleSave > 0 && max >= 2 ? (
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink/70">Choose your deal</p>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Choose your deal">
              {[1, 2].map((n) => {
                const on = (n === 1 && qty === 1) || (n === 2 && qty >= 2);
                const full = Number(product.price) * n;
                const total = full - (n === 2 ? bundleSave : 0);
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setQty(n)}
                    className={`flex items-center gap-3 rounded border bg-white px-3.5 py-3 text-left transition ${on ? "border-accent-600 ring-1 ring-accent-600" : "border-ink/15 hover:border-ink/35"}`}
                  >
                    <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-accent-600" : "border-ink/30"}`}>
                      {on && <span className="h-2 w-2 rounded-full bg-accent-600" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-ink">
                        {n === 1 ? "Buy 1" : "Buy 2"}
                        {n === 2 && <span className="rounded-sm bg-leaf-100 px-1.5 py-0.5 text-[11px] font-semibold text-leaf-600">Save {formatPrice(bundleSave)}</span>}
                      </span>
                      {n === 2 && <span className="block text-[12px] text-ink/55">Most popular</span>}
                    </span>
                    <span className="text-right">
                      <span className="block text-[15px] font-semibold text-ink">{formatPrice(total)}</span>
                      {n === 2 && <span className="block text-[12px] text-ink/40 line-through">{formatPrice(full)}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            {qty > 2 && <p className="mt-2 text-[12.5px] font-medium text-accent-700">{qty} pieces · {formatPrice(lineTotal)}</p>}
          </div>
        ) : (
          !soldOut && (
            <div className="flex h-12 w-fit items-center overflow-hidden rounded-none border border-ink/15 bg-white">
              <button className="flex h-full w-12 items-center justify-center hover:bg-sand" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                <Minus className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
              <button className="flex h-full w-12 items-center justify-center hover:bg-sand" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Increase quantity">
                <Plus className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          )
        )}
        <button disabled={soldOut} onClick={buyNow} className="flex h-[54px] w-full items-center justify-center rounded bg-accent-600 text-[15px] font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50">
          {soldOut ? "Sold out" : `Buy now · ${formatPrice(lineTotal)} · Cash on delivery`}
        </button>
        {!soldOut && STORE.whatsapp && (
          <a
            href={waHref()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.currentTarget.href = waHref(true); track.whatsappOrder(product, qty); }}
            className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded bg-[#25D366] text-[14px] font-semibold text-white transition hover:bg-[#1ebe5b]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.28l5.68-1.49a11.3 11.3 0 0 0 5.43 1.38h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.32-8.02"/></svg>
            Order on WhatsApp
          </a>
        )}
        {!soldOut && (
          <button onClick={() => add(product, qty)} className="text-[13px] font-semibold text-ink/60 underline underline-offset-4 hover:text-ink">
            or add to cart
          </button>
        )}
      </div>

      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[1fr_1.6fr] gap-2 border-t border-ink/10 bg-white px-3 pb-3 pt-2.5 lg:hidden">
          {STORE.whatsapp ? (
            <a
              href={waHref()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.currentTarget.href = waHref(true); track.whatsappOrder(product, qty); }}
              className="flex h-[50px] items-center justify-center gap-1.5 rounded bg-[#25D366] text-[14px] font-semibold text-white active:bg-[#1ebe5b]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.28l5.68-1.49a11.3 11.3 0 0 0 5.43 1.38h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.32-8.02"/></svg>
              WhatsApp
            </a>
          ) : <span />}
          <button onClick={buyNow} className="flex h-[50px] items-center justify-center rounded bg-accent-600 text-[15px] font-semibold text-white active:bg-accent-700">
            Buy now · {formatPrice(lineTotal)}
          </button>
        </div>
      )}
      {quick && <QuickOrder product={product} initialQty={qty} onClose={() => setQuick(false)} />}
    </>
  );
}
