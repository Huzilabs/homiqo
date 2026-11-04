import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST { order_number, phone, product_id, rating, comment, name } — verified-buyer review (pending admin approval). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_review", {
    p_order_number: String(b.order_number || ""),
    p_phone: String(b.phone || ""),
    p_product_id: String(b.product_id || ""),
    p_rating: Number(b.rating) || 0,
    p_comment: String(b.comment || "").slice(0, 1500),
    p_name: String(b.name || "").slice(0, 60),
  });
  if (error) return NextResponse.json({ ok: false, error: "Could not save your review. Please try again." }, { status: 400 });
  const r = data as { ok: boolean; error?: string };
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
