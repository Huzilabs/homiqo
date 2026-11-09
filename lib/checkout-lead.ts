"use client";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "./types";

const KEY = "hq.lead";

/** One lead id per checkout visit (kept until the order is placed). */
export function leadId() {
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) sessionStorage.setItem(KEY, (id = crypto.randomUUID()));
    return id;
  } catch {
    return null;
  }
}

export const clearLead = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
};

/** Save what the customer has typed so far — only once the phone number looks valid. */
export async function saveLead(form: HTMLFormElement, items: CartItem[], subtotal: number) {
  const f = new FormData(form);
  const get = (k: string) => String(f.get(k) || "").trim();
  const phone = get("phone");
  if (phone.replace(/\D/g, "").length < 10) return;
  const id = leadId();
  if (!id) return;
  let session_id: string | undefined, utm_campaign: string | undefined;
  try {
    const s = JSON.parse(localStorage.getItem("hq.sess") || "null");
    session_id = s?.id;
    utm_campaign = s?.src?.uc || undefined;
  } catch {}
  await createClient()
    .rpc("save_checkout_lead", {
      p_id: id,
      p_lead: {
        phone,
        customer_name: get("customer_name"),
        city: get("city"),
        address: get("address"),
        session_id,
        utm_campaign,
        subtotal,
        items: items.map((i) => ({ product_id: i.product_id, name: i.name, quantity: i.quantity, price: i.price })),
      },
    })
    .then(() => {}, () => {});
}
