"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "./types";
import { shippingFor } from "./config";
import { track } from "./analytics";

const KEY = "homecart.cart.v1";

interface CartCtx {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  add: (p: Product, qty?: number, openDrawer?: boolean) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((p: Product, qty = 1, openDrawer = true) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      const max = Math.max(1, Math.min(p.stock, 20));
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.id ? { ...i, quantity: Math.min(i.quantity + qty, max), stock: p.stock, price: Number(p.price) } : i,
        );
      }
      return [
        ...prev,
        {
          product_id: p.id,
          slug: p.slug,
          name: p.name,
          price: Number(p.price),
          image: p.images[0] || null,
          quantity: Math.min(qty, max),
          stock: p.stock,
        },
      ];
    });
    track.addToCart(p, qty);
    if (openDrawer) setDrawerOpen(true);
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(qty, Math.min(i.stock || 20, 20))) } : i,
      ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.product_id === productId);
      if (item) track.removeFromCart(item);
      return prev.filter((i) => i.product_id !== productId);
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = shippingFor(subtotal);
    return {
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      drawerOpen,
      setDrawerOpen,
      add,
      setQty,
      remove,
      clear,
    };
  }, [items, ready, drawerOpen, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
