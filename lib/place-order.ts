import { after } from "next/server";
import { revalidateTag } from "next/cache";
import { PRODUCTS_TAG } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { sendNewOrderAlert, sendOrderEmail } from "@/lib/email";
import type { TrackedOrder } from "@/lib/types";

/**
 * Places an order through public.place_order() and, after the response is sent, emails the customer
 * ("received") and the store owners (new-order alert). Used by checkout and by the chat assistant.
 */
export async function placeOrderAndNotify(customer: Record<string, string>, items: { product_id: string; quantity: number }[]) {
  const email = String(customer.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address, or leave it empty" } as const;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", { customer, items });
  if (error || !data) return { error: error?.message || "Could not place your order" } as const;

  const { order_number, total } = data as { order_number: string; total: number };
  revalidateTag(PRODUCTS_TAG); // stock changed

  after(async () => {
    const { data: details } = await supabase.rpc("track_order", { p_order_number: order_number, p_phone: customer.phone });
    if (!details) return;
    const o = details as TrackedOrder;
    const emailOrder = { ...o, email: email || null, phone: customer.phone, address: customer.address, postal_code: customer.postal_code || null };
    await Promise.all([sendOrderEmail("received", emailOrder), sendNewOrderAlert(emailOrder)]);
  });

  return { order_number, total: Number(total) } as const;
}
