import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST { order_number, phone, action: "confirm" | "cancel" } — the customer's answer from the order page. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { order_number?: string; phone?: string; action?: string };
  if (!["confirm", "cancel"].includes(b.action || "")) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("customer_respond_order", { p_order_number: String(b.order_number || ""), p_phone: String(b.phone || ""), p_action: b.action });
  if (error) return NextResponse.json({ ok: false, error: "Something went wrong. Please call us." }, { status: 400 });
  const r = data as { ok: boolean; error?: string };
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
