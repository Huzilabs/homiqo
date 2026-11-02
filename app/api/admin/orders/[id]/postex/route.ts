import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-auth";
import { emailOrderStatus } from "@/lib/order-email";

/** POST { action: "book", city?, pickupCode?, notify? } — admin approves the order and books it on PostEx. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminClient();
  if (!supabase) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { action?: string; city?: string; pickupCode?: string; notify?: boolean };

  if (body.action === "preview") {
    const { data, error } = await supabase.rpc("postex_order_payload", { p_order_id: id, p_city: body.city || null, p_pickup_code: body.pickupCode || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ payload: data });
  }

  if (body.action !== "book") return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const { data, error } = await supabase.rpc("postex_book_order", { p_order_id: id, p_city: body.city || null, p_pickup_code: body.pickupCode || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const result = data as { ok: boolean; error?: string; needs_city?: boolean; tracking_number?: string };
  if (!result.ok) return NextResponse.json(result, { status: 400 });

  const emailed = body.notify === false ? false : await emailOrderStatus(supabase, id, "confirmed");
  return NextResponse.json({ ...result, emailed });
}
