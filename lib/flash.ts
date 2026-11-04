"use client";
import { useEffect, useState } from "react";

export type FlashOfferState = { id: string; expires_at: string } | null;
const KEY = "hq.flash";
const EVT = "hq-flash";

export function readFlash(): FlashOfferState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null") as (FlashOfferState & { used?: boolean }) | null;
    return v && !v.used ? { id: v.id, expires_at: v.expires_at } : null;
  } catch {
    return null;
  }
}
export function writeFlash(v: (FlashOfferState & { used?: boolean }) | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
    window.dispatchEvent(new Event(EVT));
  } catch {}
}
/** After an order the offer is spent (kept so a returning visitor doesn't get a new one). */
export const markFlashUsed = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw) writeFlash({ ...raw, used: true });
  } catch {}
};
export const hadFlash = () => {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return true;
  }
};

/** Current offer + seconds left (ticks every second). Null when none or expired. */
export function useFlashOffer() {
  const [offer, setOffer] = useState<FlashOfferState>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const load = () => setOffer(readFlash());
    load();
    window.addEventListener(EVT, load);
    window.addEventListener("storage", load);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.removeEventListener(EVT, load);
      window.removeEventListener("storage", load);
      clearInterval(t);
    };
  }, []);
  const msLeft = offer ? new Date(offer.expires_at).getTime() - now : 0;
  return msLeft > 0 ? { offer: offer!, msLeft } : { offer: null, msLeft: 0 };
}

export const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
