import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Real recent orders for the "X from City just ordered Y" popup: first name, city and product only.
export const revalidate = 300;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json([]);
  const { data } = await createClient(url, key, { auth: { persistSession: false } }).rpc("recent_purchases");
  return NextResponse.json(data || [], { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
