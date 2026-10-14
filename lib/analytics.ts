"use client";
import type { CartItem, Product } from "./types";
import { STORE } from "./config";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
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

function event(name: string, params: Record<string, unknown>) {
  try {
    window.gtag?.("event", name, params);
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
