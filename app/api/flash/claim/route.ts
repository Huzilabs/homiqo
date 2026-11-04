import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST { id } — visitor reached checkout: lock the offer in (the database checks the 2-minute deadline). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { id?: string };
  if (!/^[0-9a-f-]{36}$/i.test(b.id || "")) return NextResponse.json({ ok: false }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_flash_offer", { p_id: b.id });
  if (error || !data) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json(data);
}
