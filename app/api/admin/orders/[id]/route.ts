import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { PRODUCTS_TAG } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { sendOrderEmail, type OrderEmailKind } from "@/lib/email";
import { emailOrderStatus } from "@/lib/order-email";
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

  const { data: before } = await supabase.from("orders").select("status, courier, tracking_number, postex_status").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const onPostEx = before.courier === "PostEx" && Boolean(before.tracking_number);

  // Website → PostEx: confirming an order (after the confirmation call) books it on PostEx automatically.
  // Skipped only when the admin explicitly enters a different courier.
  const otherCourier = Boolean(body.courier?.trim()) && !/postex/i.test(body.courier || "");
  if (body.status === "confirmed" && !onPostEx && !otherCourier) {
    const { data: res, error: bookError } = await supabase.rpc("postex_book_order", { p_order_id: id, p_city: null, p_pickup_code: null });
    const r = res as { ok: boolean; error?: string; needs_city?: boolean; tracking_number?: string } | null;
    if (bookError || !r?.ok) {
      return NextResponse.json(
        { error: bookError?.message || r?.error || "PostEx booking failed", needs_city: r?.needs_city },
        { status: 400 },
      );
    }
    // postex_book_order already set the status to confirmed and saved the tracking number
    const emailed = body.notify !== false && before.status !== "confirmed" ? await emailOrderStatus(supabase, id, "confirmed") : false;
    return NextResponse.json({ ok: true, emailed, tracking_number: r.tracking_number });
  }

  // Website → PostEx: cancelling a booked order cancels the shipment first
  if (onPostEx && body.status === "cancelled" && before.status !== "cancelled" && !/^(returned|cancel)/i.test(before.postex_status || "")) {
    const { data: res, error: cancelError } = await supabase.rpc("postex_cancel_order", { p_order_id: id });
    const r = res as { ok: boolean; error?: string } | null;
    if (cancelError || !r?.ok) {
      return NextResponse.json(
        { error: `${cancelError?.message || r?.error || "PostEx cancellation failed"} — the parcel may already be picked up. Use PostEx's portal to request a return.` },
        { status: 400 },
      );
    }
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update({
      status: body.status,
      // PostEx-booked orders keep the courier & tracking number PostEx issued
      courier: onPostEx ? before.courier : body.courier?.trim() || null,
      tracking_number: onPostEx ? before.tracking_number : body.tracking_number?.trim() || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !order) return NextResponse.json({ error: error?.message || "Update failed" }, { status: 400 });

  if (before.status !== body.status) revalidateTag(PRODUCTS_TAG); // cancelling returns stock

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
