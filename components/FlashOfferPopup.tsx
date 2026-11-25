"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Zap } from "lucide-react";
import { FLASH_OFFER } from "@/lib/config";
import { mmss, useFlashOffer } from "@/lib/flash";
import { FLASH_POPUP_EVENT } from "./FlashOfferInit";

export const BUY_NOW_EVENT = "hq:buy-now";

/** Meta-ad visitors: after 10 s on the site, a popup with the 2-minute extra-discount offer + delivery promises. */
export default function FlashOfferPopup() {
  const [open, setOpen] = useState(false);
  const { offer, msLeft } = useFlashOffer();
  const pathname = usePathname();
  const onProduct = pathname.startsWith("/product/");

  useEffect(() => {
    const show = () => {
      // don't cover an order form / cart that's already open
      if (document.querySelector('[role="dialog"]')) return;
      setOpen(true);
    };
    window.addEventListener(FLASH_POPUP_EVENT, show);
    return () => window.removeEventListener(FLASH_POPUP_EVENT, show);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !offer || offer.claimed) return null;
  const close = () => setOpen(false);
  const order = () => {
    close();
    if (onProduct) window.dispatchEvent(new Event(BUY_NOW_EVENT));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/55 p-0 sm:items-center sm:p-4" onClick={close} role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Special offer"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full overflow-hidden bg-paper shadow-2xl animate-fade-in sm:max-w-sm"
      >
        <button onClick={close} aria-label="Close" className="absolute right-2 top-2 z-10 p-2 text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
        <div className="bg-accent-600 px-6 pb-5 pt-6 text-center text-white">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.2em]"><Zap className="h-4 w-4 fill-current" /> Special offer for you</p>
          <p className="mt-2 text-3xl font-extrabold">Extra {FLASH_OFFER.pct}% OFF</p>
          <p className="mt-1 text-sm text-white/90">Place your order in the next</p>
          <p className="mt-2 inline-block bg-white px-4 py-1.5 font-mono text-2xl font-bold tabular-nums text-accent-700">{mmss(msLeft)}</p>
        </div>
        <ul className="space-y-2.5 px-6 py-5 text-[15px]">
          <li className="flex items-start gap-3"><span className="text-xl leading-none">🚚</span><span><b>FREE delivery</b> all over Pakistan</span></li>
          <li className="flex items-start gap-3"><span className="text-xl leading-none">📦</span><span><b>Open the parcel</b> and check it before you pay</span></li>
          <li className="flex items-start gap-3"><span className="text-xl leading-none">💵</span><span><b>Cash on delivery</b> — no advance payment</span></li>
        </ul>
        <div className="px-6 pb-6">
          <button onClick={order} className="flex w-full items-center justify-center bg-accent-600 py-3.5 text-[15px] font-bold uppercase tracking-[.1em] text-white shadow-lift active:bg-accent-700">
            {onProduct ? "Order now" : "Shop now"}
          </button>
          <button onClick={close} className="mt-2 w-full py-2 text-xs text-ink/50">No thanks</button>
        </div>
      </div>
    </div>
  );
}
