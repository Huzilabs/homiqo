"use client";
import type { CartItem, Product } from "./types";
import { STORE } from "./config";
import { sendVisitEvent } from "./visits";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type GaItem = { item_id: string; item_name: string; price: number; quantity: number; item_category?: string };

const toItem = (p: Product, quantity = 1): GaItem => ({
  item_id: p.id,
  item_name: p.name,
  item_category: p.category,
  price: Number(p.price),
  quantity,
});

const cartToItems = (items: CartItem[]): GaItem[] =>
  items.map((i) => ({ item_id: i.product_id, item_name: i.name, price: i.price, quantity: i.quantity }));

const META_EVENTS: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  search: "Search",
};

function meta(name: string, params: Record<string, unknown>) {
  const metaName = META_EVENTS[name];
  if (!metaName || !window.fbq) return;
  const items = (params.items as GaItem[] | undefined) || [];
  const data: Record<string, unknown> = {
    currency: params.currency,
    value: params.value,
    content_type: "product",
    content_ids: items.map((i) => i.item_id),
    contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })),
    num_items: items.reduce((n, i) => n + i.quantity, 0) || undefined,
  };
  if (name === "search") data.search_string = params.search_term;
  // event_id lets Meta de-duplicate if a server-side Conversions API is added later
  const eventId = name === "purchase" ? String(params.transaction_id) : undefined;
  window.fbq("track", metaName, data, eventId ? { eventID: eventId } : undefined);
}

function event(name: string, params: Record<string, unknown>) {
  try {
    window.gtag?.("event", name, params);
    meta(name, params);
    if (["view_item", "add_to_cart", "begin_checkout", "purchase"].includes(name)) {
      const items = (params.items as GaItem[] | undefined) || [];
      sendVisitEvent(name, { pid: items.length === 1 ? items[0].item_id : undefined, val: Number(params.value) || undefined });
    }
    window.clarity?.("event", name);
  } catch {
    /* analytics must never break the store */
  }
}

export const track = {
  viewItem: (p: Product) =>
    event("view_item", { currency: STORE.currency, value: Number(p.price), items: [toItem(p)] }),
  addToCart: (p: Product, qty: number) =>
    event("add_to_cart", { currency: STORE.currency, value: Number(p.price) * qty, items: [toItem(p, qty)] }),
  removeFromCart: (i: CartItem) =>
    event("remove_from_cart", { currency: STORE.currency, value: i.price * i.quantity, items: cartToItems([i]) }),
  viewCart: (items: CartItem[], value: number) =>
    event("view_cart", { currency: STORE.currency, value, items: cartToItems(items) }),
  beginCheckout: (items: CartItem[], value: number) =>
    event("begin_checkout", { currency: STORE.currency, value, items: cartToItems(items) }),
  purchase: (orderNumber: string, items: CartItem[], value: number, shipping: number) => {
    event("purchase", {
      transaction_id: orderNumber,
      currency: STORE.currency,
      value,
      shipping,
      payment_type: "cod",
      items: cartToItems(items),
    });
    try {
      window.clarity?.("set", "order_number", orderNumber);
    } catch {}
  },
  search: (term: string) => event("search", { search_term: term }),
};
