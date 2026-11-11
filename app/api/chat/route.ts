import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { BANK, FLASH_OFFER, STORE } from "@/lib/config";
import { placeOrderAndNotify } from "@/lib/place-order";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const SITE = STORE.siteUrl.replace(/\/$/, "");
const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

// Simple per-instance rate limit: 30 messages per 10 minutes per IP
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 30;
}

// At most 3 chat orders per IP per hour (stops abuse / duplicate orders)
const orderHits = new Map<string, number[]>();
function orderLimited(ip: string) {
  const now = Date.now();
  const list = (orderHits.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (list.length >= 3) return true;
  list.push(now);
  orderHits.set(ip, list);
  return false;
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_order",
      description:
        "Place a Cash on Delivery order. Call ONLY after you have the customer's full name, phone, complete address, city and the product(s) + quantity, you have shown them a summary, and they have clearly confirmed (e.g. 'yes', 'haan', 'confirm', 'theek hai').",
      parameters: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Customer full name" },
          phone: { type: "string", description: "Pakistani mobile number, e.g. 03001234567" },
          address: { type: "string", description: "Complete delivery address: house/street, area/block" },
          city: { type: "string", description: "City in Pakistan" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_slug: { type: "string", description: "The slug from the product link (the part after /product/)" },
                quantity: { type: "integer", minimum: 1, maximum: 5 },
              },
              required: ["product_slug", "quantity"],
            },
          },
          notes: { type: "string", description: "Optional delivery note / landmark" },
        },
        required: ["customer_name", "phone", "address", "city", "items"],
      },
    },
  },
];

async function systemPrompt(products: Product[]) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const catalog = products
    .map((p) => {
      const parts = (p.components || []).map((id) => byId.get(id)?.name).filter(Boolean);
      return [
        `- ${p.name} — ${rs(p.price)}${p.compare_at_price && p.compare_at_price > p.price ? ` (was ${rs(p.compare_at_price)})` : ""}`,
        `  Link: ${SITE}/product/${p.slug}`,
        `  ${p.stock > 0 ? "In stock" : "OUT OF STOCK"} · Category: ${p.category}`,
        parts.length ? `  COMBO containing: ${parts.join(" + ")}` : "",
        Number(p.bundle_save) > 0 && !parts.length ? `  Buy 2 of this, save ${rs(Number(p.bundle_save))}` : "",
        `  About: ${p.short_description}`,
        p.features?.length ? `  Features: ${p.features.join("; ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `You are the friendly shopping assistant for ${STORE.name} (${SITE}), an online store in Pakistan selling smart kitchen and home gadgets.

LANGUAGE: Always reply in the SAME language and script the customer used in their last message — if they write Roman Urdu (e.g. "kitne ka hai"), reply in Roman Urdu; Urdu script → Urdu; English → English. Keep replies short (2–5 lines), warm and clear. Use simple words. Use at most one or two emojis.

STORE FACTS (only promise these):
- Delivery: FREE delivery on every order, all over Pakistan, usually 2–5 working days (courier: PostEx).
- Payment: Cash on Delivery (COD). The customer can OPEN the parcel and check the product in front of the rider before paying.
- Bank transfer: ${BANK.discountPct}% off products (${BANK.bank}); customer sends the payment screenshot on WhatsApp ${BANK.whatsappDisplay}.
- Buy 2 of the same product: save Rs 200 (shown on each product page).
- Visitors who come from a Facebook/Instagram ad may see an extra ${FLASH_OFFER.pct}% off countdown on the site — do not promise it to others.
- Returns / warranty: there is no long warranty; damaged, faulty or wrong item → contact within 7 days of delivery for a free replacement or refund (7-day replacement). Say this when asked about warranty.
- Orders are confirmed by phone/WhatsApp before dispatch.
- WhatsApp / phone support: ${BANK.whatsappDisplay} (wa.me/${STORE.whatsapp}).
- Order status: if the customer gives their order number (like HC-ABC123) and the phone number used, give this link: ${SITE}/order/ORDER_NUMBER?phone=PHONE (fill in their values). Otherwise ask them to WhatsApp us with the order number.

ORDERING IN THIS CHAT (you can place real orders):
1. When the customer wants to buy, ask for anything missing: product + quantity, full name, phone number, complete address (house/street, area/block) and city. Ask for a few things at a time, politely.
2. Then show a short summary: product(s) × quantity with prices, any "Buy 2" saving, delivery FREE, payment Cash on Delivery, total to pay, name, phone, address, city — and ask them to reply "confirm" to place the order.
3. Only after they clearly confirm, call the create_order tool once. Never call it without confirmation, and never call it twice for the same order.
4. After it succeeds, give the order number and the total from the tool result, and say our team will call/WhatsApp to confirm before dispatch, delivery in 2–5 working days, and they can open the parcel before paying.
5. If the tool returns an error (e.g. address too short, out of stock), explain it simply and ask for the fix.
They can also order themselves: product link → "Buy now — cash on delivery", or "Order on WhatsApp".

PRODUCTS (live prices — use exactly these, never invent prices, discounts, specs, warranties, wattage, battery life or capacity that are not written here):
${catalog}

RULES:
- EVERY time you mention a product, include its link exactly as given (on its own line), so the customer can tap it and order.
- If you don't know something (e.g. a spec that isn't listed), say you're not sure and suggest WhatsApp ${BANK.whatsappDisplay}.
- Never claim the store manufactures the products. No medical or health advice.
- Don't discuss other stores, politics or anything unrelated to shopping at ${STORE.name}; politely steer back.
- Never ask for card or bank passwords/OTPs. Only collect name, phone, address and city for an order — nothing else.
- Out-of-stock products: say so and suggest WhatsApp to ask when it's back.`;
}

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: "Chat is not configured" }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  if (limited(ip)) return NextResponse.json({ error: "Too many messages — please WhatsApp us instead." }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as { messages?: { role: string; content: string }[]; page?: string };
  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 800) }));
  if (!history.length || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "No question" }, { status: 400 });
  }
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : "";

  const products = await getProducts();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
  type Msg = { role: string; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string };
  const messages: Msg[] = [
    { role: "system", content: (await systemPrompt(products)) + (page ? `\n\nThe customer is currently on this page: ${SITE}${page}` : "") },
    ...history,
  ];
  let placed: { order_number: string; total: number; phone: string; items: { product_id: string; name: string; price: number; quantity: number }[] } | null = null;

  try {
    for (let round = 0; round < 3; round++) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": SITE,
          "X-Title": STORE.name,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, max_tokens: 500, temperature: 0.3, messages, ...(placed ? {} : { tools: TOOLS }) }),
        signal: AbortSignal.timeout(25000),
      });
      const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[]; error?: { message?: string } } | null;
      const msg = data?.choices?.[0]?.message;
      if (!res.ok || !msg) {
        console.error("openrouter", res.status, data?.error?.message);
        break;
      }
      if (!msg.tool_calls?.length) {
        const reply = msg.content?.trim();
        if (!reply) break;
        return NextResponse.json({ reply, order: placed });
      }

      messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });
      for (const call of msg.tool_calls) {
        let result: Record<string, unknown>;
        if (call.function.name !== "create_order" || placed) {
          result = { ok: false, error: placed ? "Order already placed in this chat." : "Unknown tool" };
        } else {
          let args: { customer_name?: string; phone?: string; address?: string; city?: string; notes?: string; items?: { product_slug?: string; quantity?: number }[] } = {};
          try {
            args = JSON.parse(call.function.arguments || "{}");
          } catch {}
          const lines = (args.items || []).map((i) => ({
            p: bySlug.get(String(i.product_slug || "").replace(/^.*\/product\//, "").replace(/[/?#].*$/, "")),
            q: Math.min(5, Math.max(1, Number(i.quantity) || 1)),
          }));
          if (!lines.length || lines.some((l) => !l.p)) {
            result = { ok: false, error: "Unknown product — use the slug from the product link." };
          } else if (orderLimited(ip)) {
            result = { ok: false, error: "Too many orders from this device. Ask the customer to WhatsApp us instead." };
          } else {
            const out = await placeOrderAndNotify(
              {
                customer_name: String(args.customer_name || ""),
                phone: String(args.phone || ""),
                address: String(args.address || ""),
                city: String(args.city || ""),
                notes: ["Ordered via website chat assistant", args.notes].filter(Boolean).join(" · "),
                payment_method: "cod",
              },
              lines.map((l) => ({ product_id: l.p!.id, quantity: l.q })),
            );
            if ("error" in out) {
              result = { ok: false, error: String(out.error) };
            } else {
              placed = {
                order_number: out.order_number,
                total: out.total,
                phone: String(args.phone || ""),
                items: lines.map((l) => ({ product_id: l.p!.id, name: l.p!.name, price: Number(l.p!.price), quantity: l.q })),
              };
              result = { ok: true, order_number: out.order_number, total_to_pay_cod: out.total, order_link: `${SITE}/order/${out.order_number}?phone=${encodeURIComponent(placed.phone)}` };
            }
          }
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }
  } catch (e) {
    console.error("openrouter", e);
  }
  if (placed) {
    return NextResponse.json({
      reply: `✅ Order placed! Your order number is ${placed.order_number}. Total ${rs(placed.total)} (Cash on Delivery, free delivery). Our team will call you to confirm before dispatch.`,
      order: placed,
    });
  }
  return NextResponse.json({ error: "Sorry, I couldn't answer right now. Please WhatsApp us." }, { status: 502 });

}
