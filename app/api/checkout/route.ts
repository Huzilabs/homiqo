import { after, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { PRODUCTS_TAG } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { sendNewOrderAlert, sendOrderEmail } from "@/lib/email";
import type { TrackedOrder } from "@/lib/types";

export async function POST(req: Request) {
  let body: { customer?: Record<string, string>; items?: { product_id: string; quantity: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const customer = body.customer || {};
  const email = String(customer.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", { customer, items: body.items || [] });
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not place your order" }, { status: 400 });

  const { order_number, total } = data as { order_number: string; total: number };

  // Stock changed — refresh the cached storefront
  revalidateTag(PRODUCTS_TAG);

  // Emails go out after the customer already has their confirmation (keeps checkout fast)
  after(async () => {
    const { data: details } = await supabase.rpc("track_order", { p_order_number: order_number, p_phone: customer.phone });
    if (!details) return;
    const o = details as TrackedOrder;
    const emailOrder = { ...o, email, phone: customer.phone, address: customer.address };
    await Promise.all([sendOrderEmail("received", emailOrder), sendNewOrderAlert(emailOrder)]);
  });

  return NextResponse.json({ order_number, total });
}
