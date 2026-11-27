import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { PRODUCTS_TAG } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { isPkMobile } from "@/lib/phone";

type Body = {
  customer?: { customer_name?: string; phone?: string; city?: string; address?: string; notes?: string };
  items?: { product_id?: string; quantity?: number; unit_price?: number }[];
  confirm?: boolean;
  lead_id?: string;
};

/** Admin: create a COD order by hand (WhatsApp/phone orders, or a fixed-up abandoned checkout). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const b = (await req.json().catch(() => ({}))) as Body;
  const c = b.customer || {};
  if (!isPkMobile(c.phone || "")) return NextResponse.json({ error: "Enter a complete mobile number, e.g. 0300 1234567" }, { status: 400 });
  const items = (b.items || [])
    .filter((i) => i.product_id && Number(i.quantity) > 0)
    .map((i) => ({ product_id: i.product_id, quantity: Math.min(20, Math.floor(Number(i.quantity))) }));
  if (!items.length) return NextResponse.json({ error: "Add at least one product" }, { status: 400 });

  const note = (c.notes || "").trim();
  const { data, error } = await supabase.rpc("place_order", {
    customer: {
      customer_name: (c.customer_name || "").trim(),
      phone: (c.phone || "").trim(),
      city: (c.city || "").trim(),
      address: (c.address || "").trim(),
      notes: note || null,
      payment_method: "cod",
    },
    items,
  });
  if (error) return NextResponse.json({ error: error.message.replace(/^.*?: /, "") }, { status: 400 });
  const order = data as { order_number: string; total: number };

  const { data: row } = await supabase.from("orders").select("id").eq("order_number", order.order_number).maybeSingle();
  if (row) {
    await supabase.from("order_events").insert({ order_id: row.id, status: "pending", note: b.lead_id ? "Created by admin from an abandoned checkout" : "Created by admin (WhatsApp / phone order)" });
    await supabase.from("orders").update({ source: b.lead_id ? "abandoned" : "whatsapp", ...(b.confirm ? { status: "confirmed" } : {}) }).eq("id", row.id);
    if (b.lead_id) await supabase.from("checkout_leads").update({ status: "converted", order_id: row.id, updated_at: new Date().toISOString() }).eq("id", b.lead_id);
  }
  // special price (repeat customer etc.): place_order always uses the shop price, so set the agreed price right after
  let total = order.total;
  const special = (b.items || []).filter((i) => i.product_id && Number(i.quantity) > 0);
  if (row && special.some((i) => Number(i.unit_price) > 0)) {
    const { data: up, error: ue } = await supabase.rpc("admin_update_order", {
      p_order_id: row.id,
      p_customer: { customer_name: (c.customer_name || "").trim(), phone: (c.phone || "").trim(), city: (c.city || "").trim(), address: (c.address || "").trim() },
      p_items: special.map((i) => ({
        product_id: i.product_id,
        quantity: Math.min(20, Math.floor(Number(i.quantity))),
        ...(Number(i.unit_price) > 0 ? { unit_price: Math.round(Number(i.unit_price)) } : {}),
      })),
    });
    if (ue) return NextResponse.json({ error: `Order ${order.order_number} created at the normal price — special price failed: ${ue.message}` }, { status: 400 });
    total = (up as { total: number }).total;
  }
  revalidateTag(PRODUCTS_TAG); // stock changed
  return NextResponse.json({ ok: true, order_number: order.order_number, id: row?.id, total });
}
