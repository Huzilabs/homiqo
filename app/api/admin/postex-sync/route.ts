import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-auth";
import { emailOrderStatus } from "@/lib/order-email";
import type { OrderEmailKind } from "@/lib/email";

/** Pull the latest PostEx statuses now (also runs automatically every 15 minutes in the database). */
export async function POST() {
  const supabase = await adminClient();
  if (!supabase) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const { data, error } = await supabase.rpc("postex_sync");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const result = data as { checked: number; updated: number; changes: { order_id: string; to: string }[]; errors: unknown[] };

  // Let customers know when their parcel ships or arrives
  let emailed = 0;
  for (const c of result.changes || []) {
    if (c.to === "shipped" || c.to === "delivered") {
      if (await emailOrderStatus(supabase, c.order_id, c.to as OrderEmailKind)) emailed++;
    }
  }
  return NextResponse.json({ ...result, emailed });
}
