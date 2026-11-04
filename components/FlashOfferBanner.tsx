"use client";
import { Zap } from "lucide-react";
import { FLASH_OFFER } from "@/lib/config";
import { mmss, useFlashOffer } from "@/lib/flash";

/** Countdown for the Meta-ad offer. variant="bar" for the top bar, "box" on the product page. */
export default function FlashOfferBanner({ variant = "bar" }: { variant?: "bar" | "box" }) {
  const { offer, msLeft } = useFlashOffer();
  if (!offer) return null;
  if (variant === "box")
    return (
      <p className="flex items-center gap-2.5 border border-accent-500/50 bg-accent-50 px-4 py-3 text-sm text-accent-700">
        <Zap className="h-4 w-4 shrink-0 fill-current" />
        <span>
          <b>Special offer for you:</b> extra {FLASH_OFFER.pct}% off if you order in the next <b className="tabular-nums">{mmss(msLeft)}</b> — applied automatically at checkout
        </span>
      </p>
    );
  return (
    <div className="bg-accent-600 px-4 py-2 text-center text-[12px] font-medium tracking-wide text-white">
      <Zap className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px fill-current" />
      Extra {FLASH_OFFER.pct}% off — order in the next <b className="tabular-nums">{mmss(msLeft)}</b>
    </div>
  );
}
