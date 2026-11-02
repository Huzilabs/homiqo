import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOrderEmail, type OrderEmailKind } from "./email";
import type { Order, OrderItem } from "./types";

/** Loads an order with its items and emails the customer about a status change. */
export async function emailOrderStatus(supabase: SupabaseClient, orderId: string, kind: OrderEmailKind) {
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", orderId),
  ]);
  if (!order) return false;
  const o = order as Order;
  return sendOrderEmail(kind, {
    ...o,
    subtotal: Number(o.subtotal),
    shipping_fee: Number(o.shipping_fee),
    total: Number(o.total),
    items: ((items || []) as OrderItem[]).map((i) => ({ ...i, unit_price: Number(i.unit_price), line_total: Number(i.line_total) })),
  });
}
