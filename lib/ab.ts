"use client";
/**
 * 50/50 test: "sheet" = order form slides up on the product page, "page" = the normal /checkout page.
 * A visitor keeps the same variant (localStorage). Force one with ?qo=sheet or ?qo=page in the URL.
 * Results: admin Analytics → begin_checkout/purchase events with path /product/… are the sheet, /checkout the page.
 */
export type QuickOrderVariant = "sheet" | "page";
const KEY = "hq.ab.qo";

export function quickOrderVariant(): QuickOrderVariant {
  try {
    const forced = new URLSearchParams(location.search).get("qo");
    if (forced === "sheet" || forced === "page") localStorage.setItem(KEY, forced);
    let v = localStorage.getItem(KEY) as QuickOrderVariant | null;
    if (v !== "sheet" && v !== "page") localStorage.setItem(KEY, (v = Math.random() < 0.5 ? "sheet" : "page"));
    (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity?.("set", "qo_variant", v);
    return v;
  } catch {
    return "page";
  }
}
