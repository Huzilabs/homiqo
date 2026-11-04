import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST { source } — starts a timed Meta-ad offer (expiry is set by the database, not the browser). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { source?: string };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_flash_offer", { p_source: String(b.source || "meta").slice(0, 40) });
  if (error || !data) return NextResponse.json({ error: "unavailable" }, { status: 400 });
  return NextResponse.json(data);
}
