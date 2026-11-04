"use client";
import Link from "next/link";
import { Zap } from "lucide-react";
import { FLASH_OFFER } from "@/lib/config";
import { mmss, useFlashOffer } from "@/lib/flash";

/** Meta-ad offer: 2 minutes to reach checkout, then the extra 5% is locked in. */
export default function FlashOfferBanner({ variant = "bar" }: { variant?: "bar" | "box" }) {
  const { offer, msLeft } = useFlashOffer();
  if (!offer) return null;
  const claimed = offer.claimed;

  if (variant === "box")
    return (
      <p className="flex items-center gap-2.5 border border-accent-500/50 bg-accent-50 px-4 py-3 text-sm text-accent-700">
        <Zap className="h-4 w-4 shrink-0 fill-current" />
        {claimed ? (
          <span><b>Extra {FLASH_OFFER.pct}% off is locked in</b> — complete your order within <b className="tabular-nums">{mmss(msLeft)}</b></span>
        ) : (
          <span>
            <b>Special offer for you:</b> go to checkout in the next <b className="tabular-nums">{mmss(msLeft)}</b> and get an <b>extra {FLASH_OFFER.pct}% off</b> — tap “Buy now”
          </span>
        )}
      </p>
    );

  return (
    <div className="bg-accent-600 px-4 py-2 text-center text-[12px] font-medium tracking-wide text-white">
      <Zap className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px fill-current" />
      {claimed ? (
        <>Extra {FLASH_OFFER.pct}% off locked in — complete your order within <b className="tabular-nums">{mmss(msLeft)}</b></>
      ) : (
        <>
          Reach checkout in <b className="tabular-nums">{mmss(msLeft)}</b> for an extra {FLASH_OFFER.pct}% off{" "}
          <Link href="/checkout" className="ml-1 underline underline-offset-2">Checkout now →</Link>
        </>
      )}
    </div>
  );
}
