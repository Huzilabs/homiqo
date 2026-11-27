import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { PRODUCTS_TAG } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

/**
 * Edit a pending/confirmed order: products & quantities, customer details.
 * If it's booked on PostEx (not picked up yet) the booking is cancelled, the order updated, then booked again
 * so the new COD amount reaches PostEx.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const b = (await req.json().catch(() => ({}))) as { customer?: Record<string, string>; items?: { product_id: string; quantity: number; unit_price?: number }[] };
  const items = (b.items || [])
    .filter((i) => i.product_id && Number(i.quantity) > 0)
    .map((i) => ({
      product_id: i.product_id,
      quantity: Math.min(50, Math.floor(Number(i.quantity))),
      ...(Number(i.unit_price) > 0 ? { unit_price: Math.round(Number(i.unit_price)) } : {}),
    }));
  if (!items.length) return NextResponse.json({ error: "Add at least one product" }, { status: 400 });

  const { data: before } = await supabase.from("orders").select("status, courier, tracking_number, postex_status, postex_city").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!["pending", "confirmed"].includes(before.status)) {
    return NextResponse.json({ error: "Only pending or confirmed orders can be edited" }, { status: 400 });
  }
  const wasBooked = before.courier === "PostEx" && Boolean(before.tracking_number) && !/^cancel/i.test(before.postex_status || "");

  if (wasBooked) {
    const { data: c, error: ce } = await supabase.rpc("postex_cancel_order", { p_order_id: id });
    const r = c as { ok: boolean; error?: string } | null;
    if (ce || !r?.ok) {
      return NextResponse.json(
        { error: `Couldn't cancel the PostEx booking to change the order (${ce?.message || r?.error || "PostEx error"}). The parcel may already be picked up.` },
        { status: 400 },
      );
    }
  }

  const { data: res, error } = await supabase.rpc("admin_update_order", { p_order_id: id, p_customer: b.customer || {}, p_items: items });
  if (error) {
    if (wasBooked) {
      // edit failed after the booking was cancelled: book the unchanged order again
      await supabase.from("orders").update({ courier: null, tracking_number: null, postex_status: null }).eq("id", id);
      await supabase.rpc("postex_book_order", { p_order_id: id, p_city: before.postex_city, p_pickup_code: null });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  revalidateTag(PRODUCTS_TAG); // stock changed

  let tracking: string | null = null;
  let rebookError: string | null = null;
  if (wasBooked) {
    const { data: bk, error: be } = await supabase.rpc("postex_book_order", { p_order_id: id, p_city: before.postex_city, p_pickup_code: null });
    const r = bk as { ok: boolean; error?: string; tracking_number?: string } | null;
    if (be || !r?.ok) rebookError = be?.message || r?.error || "PostEx booking failed";
    else tracking = r.tracking_number || null;
  }
  const out = res as { total: number; old_total: number };
  return NextResponse.json({ ok: true, total: out.total, old_total: out.old_total, rebooked: wasBooked, tracking, rebook_error: rebookError });
}
