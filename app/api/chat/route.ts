import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import { BANK, FLASH_OFFER, STORE } from "@/lib/config";

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

async function systemPrompt() {
  const products = await getProducts();
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

HOW TO ORDER: open the product link and tap "Buy now — cash on delivery", fill name, phone, address and city. Or tap "Order on WhatsApp" on the product page.

PRODUCTS (live prices — use exactly these, never invent prices, discounts, specs, warranties, wattage, battery life or capacity that are not written here):
${catalog}

RULES:
- EVERY time you mention a product, include its link exactly as given (on its own line), so the customer can tap it and order.
- If you don't know something (e.g. a spec that isn't listed), say you're not sure and suggest WhatsApp ${BANK.whatsappDisplay}.
- Never claim the store manufactures the products. No medical or health advice.
- Don't discuss other stores, politics or anything unrelated to shopping at ${STORE.name}; politely steer back.
- Never ask for card or bank passwords/OTPs. Don't collect the customer's address in chat — send them to the product page or WhatsApp to order.
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

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE,
        "X-Title": STORE.name,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        temperature: 0.4,
        messages: [
          { role: "system", content: (await systemPrompt()) + (page ? `\n\nThe customer is currently on this page: ${SITE}${page}` : "") },
          ...history,
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } } | null;
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!res.ok || !reply) {
      console.error("openrouter", res.status, data?.error?.message);
      return NextResponse.json({ error: "Sorry, I couldn't answer right now. Please WhatsApp us." }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("openrouter", e);
    return NextResponse.json({ error: "Sorry, I couldn't answer right now. Please WhatsApp us." }, { status: 502 });
  }
}
