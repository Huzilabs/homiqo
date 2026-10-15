import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TYPES = new Set(["pageview", "view_item", "add_to_cart", "begin_checkout", "purchase"]);
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|monitor/i;
const UUID = /^[0-9a-f-]{36}$/i;
const cut = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);

/** Records a first-party analytics event (visits, product views, carts, checkouts, purchases). */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") || "";
  if (BOT.test(ua)) return new NextResponse(null, { status: 204 });

  let b: Record<string, unknown>;
  try {
    b = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!TYPES.has(String(b.type)) || typeof b.vid !== "string" || typeof b.sid !== "string") {
    return new NextResponse(null, { status: 400 });
  }
  const path = cut(b.path, 300);
  if (path?.startsWith("/admin")) return new NextResponse(null, { status: 204 });

  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";
  const country = (req.headers.get("x-vercel-ip-country") || "").slice(0, 2) || null;

  const supabase = await createClient();
  const { error } = await supabase.from("analytics_events").insert({
    type: b.type,
    visitor_id: b.vid.slice(0, 64),
    session_id: b.sid.slice(0, 64),
    path,
    product_id: typeof b.pid === "string" && UUID.test(b.pid) ? b.pid : null,
    referrer: cut(b.ref, 300),
    utm_source: cut(b.us, 100),
    utm_medium: cut(b.um, 100),
    utm_campaign: cut(b.uc, 150),
    device,
    country,
    value: typeof b.val === "number" && isFinite(b.val) ? b.val : null,
  });
  if (error) console.error("track", error.message);
  return new NextResponse(null, { status: 204 });
}
