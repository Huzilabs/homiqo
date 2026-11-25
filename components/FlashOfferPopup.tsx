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

  const left = mmss(msLeft).split(":");
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-5 backdrop-blur-[2px]" onClick={close} role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Special offer"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] animate-fade-in overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button onClick={close} aria-label="Close" className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-white hover:bg-black/25"><X className="h-4 w-4" /></button>

        <div className="bg-gradient-to-br from-accent-500 to-accent-700 px-6 pb-6 pt-7 text-center text-white">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em]">
            <Zap className="h-3 w-3 fill-current" /> Only for you
          </span>
          <p className="mt-3 text-[34px] font-extrabold leading-none">Extra {FLASH_OFFER.pct}% OFF</p>
          <p className="mt-2 text-[13px] text-white/85">if you place your order within</p>
          <div className="mt-3 flex items-center justify-center gap-1.5 font-bold tabular-nums">
            <span className="w-14 rounded-lg bg-white py-2 text-2xl text-accent-700 shadow">{left[0]}</span>
            <span className="text-2xl">:</span>
            <span className="w-14 rounded-lg bg-white py-2 text-2xl text-accent-700 shadow">{left[1]}</span>
          </div>
          <p className="mt-1.5 flex justify-center gap-[3.6rem] text-[10px] uppercase tracking-wider text-white/70"><span>min</span><span>sec</span></p>
        </div>

        <ul className="divide-y divide-ink/5 px-5 py-2 text-[14px] text-ink">
          <li className="flex items-center gap-3 py-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-lg">🚚</span><span><b>Free delivery</b> all over Pakistan</span></li>
          <li className="flex items-center gap-3 py-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-lg">📦</span><span><b>Open &amp; check</b> the parcel before paying</span></li>
          <li className="flex items-center gap-3 py-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-lg">💵</span><span><b>Cash on delivery</b> · no advance</span></li>
        </ul>

        <div className="px-5 pb-5">
          <button onClick={order} className="w-full rounded-xl bg-accent-600 py-3.5 text-[15px] font-bold text-white shadow-lift transition active:scale-[.98] active:bg-accent-700">
            {onProduct ? "Order now & save" : "Shop now & save"} →
          </button>
          <button onClick={close} className="mt-1.5 w-full py-2 text-xs text-ink/45">Maybe later</button>
        </div>
      </div>
    </div>
  );
}
