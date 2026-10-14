import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOrderEmail, type OrderEmailKind } from "@/lib/email";
import { ORDER_STATUSES } from "@/lib/config";
import type { Order, OrderItem } from "@/lib/types";

const EMAIL_ON: OrderEmailKind[] = ["confirmed", "shipped", "delivered", "cancelled"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { status?: string; courier?: string; tracking_number?: string; notify?: boolean };
  if (!body.status || !(ORDER_STATUSES as readonly string[]).includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: before } = await supabase.from("orders").select("status").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const { data: order, error } = await supabase
    .from("orders")
    .update({
      status: body.status,
      courier: body.courier?.trim() || null,
      tracking_number: body.tracking_number?.trim() || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !order) return NextResponse.json({ error: error?.message || "Update failed" }, { status: 400 });

  let emailed = false;
  const changed = before.status !== body.status;
  if (body.notify !== false && changed && EMAIL_ON.includes(body.status as OrderEmailKind)) {
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
    const o = order as Order;
    emailed = await sendOrderEmail(body.status as OrderEmailKind, {
      ...o,
      subtotal: Number(o.subtotal),
      shipping_fee: Number(o.shipping_fee),
      total: Number(o.total),
      items: ((items || []) as OrderItem[]).map((i) => ({ ...i, unit_price: Number(i.unit_price), line_total: Number(i.line_total) })),
    });
  }

  return NextResponse.json({ ok: true, emailed, hasEmail: Boolean((order as Order).email) });
}
