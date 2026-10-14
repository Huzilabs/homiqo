import { NextResponse } from "next/server";
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

  // Order details for the emails (server-side lookup; prices come from the database)
  const { data: details } = await supabase.rpc("track_order", { p_order_number: order_number, p_phone: customer.phone });
  if (details) {
    const o = details as TrackedOrder;
    const emailOrder = { ...o, email, phone: customer.phone, address: customer.address };
    await Promise.all([sendOrderEmail("received", emailOrder), sendNewOrderAlert(emailOrder)]);
  }

  return NextResponse.json({ order_number, total });
}
