"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { hadFlash, writeFlash } from "@/lib/flash";

const META = /^(facebook|instagram|fb|ig|meta)$/i;
export const FLASH_POPUP_EVENT = "hq:flash-popup";
const DELAY_MS = 10_000;

/**
 * Starts the timed offer once, for visitors who arrive from a Meta (Facebook/Instagram) ad —
 * after they've stayed 10 seconds, so the 2-minute timer starts together with the offer popup.
 */
export default function FlashOfferInit() {
  const params = useSearchParams();
  useEffect(() => {
    // ?offer=test — forget an earlier offer in this browser so the popup can be tested again
    if (params.get("offer") === "test") {
      try { localStorage.removeItem("hq.flash"); } catch {}
    }
    const source = params.get("utm_source") || (params.get("offer") === "test" ? "test" : "");
    const fromMeta = META.test(source) || params.has("fbclid") || source === "test";
    if (!fromMeta || hadFlash()) return;
    const t = setTimeout(() => {
      if (hadFlash()) return;
      fetch("/api/flash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: source || "fbclid" }) })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d?.id) return;
          writeFlash({ id: d.id, expires_at: d.expires_at });
          window.dispatchEvent(new Event(FLASH_POPUP_EVENT));
        })
        .catch(() => {});
    }, DELAY_MS);
    return () => clearTimeout(t);
    // run once per landing (params of the landing URL); later page changes keep the layout mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
