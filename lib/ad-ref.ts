"use client";
/**
 * Remembers which Meta ad brought the visitor (for 7 days) so WhatsApp order messages can carry a short reference.
 * Meta fills these from the ad's URL parameters: hq_as={{adset.id}} (and utm_campaign={{campaign.name}}, already set on our ads).
 */
const KEY = "hq.adref";
const TTL = 7 * 864e5;
type AdRef = { as?: string; c?: string; t: number };

export function captureAdRef() {
  try {
    const q = new URLSearchParams(location.search);
    const as = (q.get("hq_as") || q.get("adset_id") || "").replace(/[^0-9]/g, "").slice(0, 25);
    const c = (q.get("utm_campaign") || "").slice(0, 60);
    const fromAd = as || (c && (q.get("fbclid") || /facebook|instagram|fb|ig/i.test(q.get("utm_source") || "")));
    if (fromAd) localStorage.setItem(KEY, JSON.stringify({ as: as || undefined, c: c || undefined, t: Date.now() } satisfies AdRef));
  } catch {}
}

/** "\n\nRef: AS 1234567890" — empty when the visitor didn't come from an ad in the last 7 days */
export function adRefNote() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || "null") as AdRef | null;
    if (!r || Date.now() - r.t > TTL) return "";
    if (r.as) return `\n\nRef: AS ${r.as}`;
    if (r.c) return `\n\nRef: ${r.c}`;
  } catch {}
  return "";
}
