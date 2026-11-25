// Sends a push notification to every admin device when a new order is saved,
// (lead_id) when someone left the order form without ordering, (attempt_order_id) when a PostEx
// delivery attempt fails, and (customer_response_order_id) when a customer confirms / cancels online.
// Called by the orders_push_notify trigger (pg_net) with the x-hook-secret header.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const rs = (n: number) => "Rs " + Math.round(n).toLocaleString("en-US");

Deno.serve(async (req) => {
  const { data: cfg } = await supabase.rpc("push_config");
  const c = cfg as { public: string; private: string; hook: string } | null;
  if (!c || req.headers.get("x-hook-secret") !== c.hook) return new Response("forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  let payload: Record<string, unknown>;
  if (body.test) {
    payload = { title: "🔔 Homiqo notifications are on", body: "You'll get a notification here for every new order.", url: "/admin/orders", tag: "test" };
  } else if (body.attempt_order_id || body.customer_response_order_id) {
    const id = body.attempt_order_id || body.customer_response_order_id;
    const { data: o } = await supabase.from("orders").select("id, order_number, customer_name, phone, city, total, postex_attempt_reason, customer_response").eq("id", id).maybeSingle();
    if (!o) return new Response("no order", { status: 404 });
    if (body.attempt_order_id) {
      payload = {
        title: `⚠️ Delivery problem — ${o.order_number}`,
        body: `Rider: ${o.postex_attempt_reason || "attempt failed"}\n${o.customer_name} · ${o.city} · ${o.phone}\nCall the customer now, then ask PostEx to re-attempt.`,
        url: `/admin/orders/${o.id}`,
        tag: `attempt-${o.order_number}`,
        kind: "alert",
      };
    } else {
      const resp = o.customer_response;
      payload = {
        title: resp === "confirmed" ? `✅ ${o.customer_name} confirmed ${o.order_number}` : resp === "cancelled" ? `❌ ${o.customer_name} cancelled ${o.order_number}` : `❗ ${o.customer_name} wants to cancel ${o.order_number}`,
        body: resp === "confirmed" ? `${o.city} · ${rs(Number(o.total))} — ready to book on PostEx.` : resp === "cancelled" ? `${o.city} · ${rs(Number(o.total))} — cancelled by the customer, stock returned.` : `Already booked — cancel it on PostEx before pickup.`,
        url: `/admin/orders/${o.id}`,
        tag: `resp-${o.order_number}`,
        kind: "alert",
      };
    }
  } else if (body.lead_id) {
    // abandoned checkout: filled the order form (with a valid phone) but didn't order
    const { data: l } = await supabase.from("checkout_leads").select("id, customer_name, phone, city, items, subtotal, status").eq("id", body.lead_id).maybeSingle();
    if (!l || l.status !== "open") return new Response("no lead", { status: 404 });
    const items = Array.isArray(l.items) ? (l.items as { name?: string; quantity?: number }[]).map((i) => `${i.quantity || 1}× ${i.name || "item"}`).join(", ") : "";
    payload = {
      title: `⏳ Didn't finish ordering — ${l.customer_name || "a customer"}${l.subtotal ? ` · ${rs(Number(l.subtotal))}` : ""}`,
      body: `${l.phone}${l.city ? ` · ${l.city}` : ""}${items ? `\n${items}` : ""}\nCall or WhatsApp now while they're interested.`,
      url: "/admin/abandoned",
      tag: `lead-${l.id}`,
      kind: "lead",
    };
  } else {
    const { data: o } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, city, total, payment_method, notes, order_items(product_name, quantity)")
      .eq("id", body.order_id)
      .maybeSingle();
    if (!o) return new Response("no order", { status: 404 });
    const items = ((o.order_items || []) as { product_name: string; quantity: number }[]).map((i) => `${i.quantity}× ${i.product_name}`).join(", ");
    const source = /whatsapp|admin/i.test(o.notes || "") ? " · WhatsApp" : /chat assistant/i.test(o.notes || "") ? " · Chat" : "";
    payload = {
      title: `🛒 New order ${o.order_number} — ${rs(Number(o.total))}`,
      body: `${o.customer_name} · ${o.city}${source}\n${items}`,
      url: `/admin/orders/${o.id}`,
      tag: o.order_number,
    };
  }

  webpush.setVapidDetails("mailto:homiqo.officialsite@gmail.com", c.public, c.private);
  const { data: subs } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  let sent = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 60 * 60 * 24, urgency: "high" });
      sent++;
      await supabase.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await supabase.from("push_subscriptions").delete().eq("id", s.id); // device unsubscribed
    }
  }
  return new Response(JSON.stringify({ sent, devices: subs?.length || 0 }), { headers: { "Content-Type": "application/json" } });
});
