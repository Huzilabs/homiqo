"use client";
/**
 * Quick-order test (20–24 Nov 2026) is finished: the form that slides up on the product page won
 * (16 orders vs 7 for the /checkout page from the same traffic), so every visitor now gets "sheet".
 * Add ?qo=page to a product URL to see the old checkout-page flow.
 */
export type QuickOrderVariant = "sheet" | "page";

export function quickOrderVariant(): QuickOrderVariant {
  try {
    return new URLSearchParams(location.search).get("qo") === "page" ? "page" : "sheet";
  } catch {
    return "sheet";
  }
}
