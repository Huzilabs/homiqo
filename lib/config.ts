export const STORE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Homiqo",
  tagline: "Smart kitchen & home essentials, delivered to your door",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.homiqoofficial.site",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+92 305 4471454",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "923054471454",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/homiqo.offical/",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/profile.php?id=61595336193707",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "",
  currency: "PKR",
};

// Free delivery on every order, all over Pakistan. Keep in sync with public.place_order().
export const SHIPPING_FEE = 0;
export const FREE_SHIPPING_THRESHOLD = 0;
export const FREE_DELIVERY_MIN_ITEMS = 1;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const shippingFor = (_subtotal: number, _units = 1) => 0;

/** Bank transfer (prepaid) — 5% off the products (delivery charged as normal). Keep in sync with public.place_order(). */
export const BANK = {
  bank: "Meezan Bank",
  title: "AMIR SOHAIL",
  account: "10010111768253",
  iban: "PK84MEZN0010010111768253",
  branch: "Kasur Branch",
  whatsapp: "923054471454", // payment screenshots go here
  whatsappDisplay: "+92 305 4471454",
  discountPct: 5,
};
/** Meta-ad visitor offer: reach checkout within 2 minutes of arriving → extra 5% off, locked in for 30 minutes to finish the order.
 *  Keep in sync with start_flash_offer() / claim_flash_offer() / place_order(). */
export const FLASH_OFFER = { reachMinutes: 2, completeMinutes: 30, pct: 3 };
export const flashDiscount = (subtotal: number) => Math.round(subtotal * FLASH_OFFER.pct / 100);

export const bankDiscount = (subtotal: number) => Math.round(subtotal * BANK.discountPct / 100);

/** Bundle saving: Rs `bundle_save` off for every 2 units of the same product. Keep in sync with public.place_order(). */
export const bundleDiscount = (items: { quantity: number; bundle_save?: number }[]) =>
  items.reduce((s, i) => s + Math.floor(i.quantity / 2) * Number(i.bundle_save || 0), 0);

export type ComboDef = { id: string; price: number; components: string[] };

/**
 * Combo + buy-2 savings for a cart. Mirrors public.place_order(): components bought separately get the combo price
 * first; buy-2 savings apply to the units left over.
 */
export function cartSavings(
  items: { product_id: string; price: number; quantity: number; bundle_save?: number }[],
  combos: ComboDef[],
) {
  const qty = new Map(items.map((i) => [i.product_id, i.quantity]));
  const price = new Map(items.map((i) => [i.product_id, Number(i.price)]));
  let combo = 0;
  for (const c of combos) {
    if (!c.components.length || c.components.some((id) => !price.has(id))) continue;
    const n = Math.min(...c.components.map((id) => qty.get(id) || 0));
    const parts = c.components.reduce((s, id) => s + (price.get(id) || 0), 0);
    if (n > 0 && parts > c.price) {
      combo += n * (parts - c.price);
      c.components.forEach((id) => qty.set(id, (qty.get(id) || 0) - n));
    }
  }
  const bundle = items.reduce((s, i) => s + Math.floor((qty.get(i.product_id) || 0) / 2) * Number(i.bundle_save || 0), 0);
  return { combo, bundle };
}

export const MEDIA_BUCKET = "product-media";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
