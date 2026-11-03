export const STORE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "Homiqo",
  tagline: "Smart kitchen & home essentials, delivered to your door",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.homiqoofficial.site",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "923054471454",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/homiqo.offical/",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/profile.php?id=61595336193707",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "",
  currency: "PKR",
};

// Keep in sync with public.place_order() in supabase/schema.sql
export const SHIPPING_FEE = 250;
export const FREE_SHIPPING_THRESHOLD = 5000;

export const shippingFor = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

/** Bank transfer (prepaid) — 5% off the products + free delivery. Keep in sync with public.place_order(). */
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
export const bankDiscount = (subtotal: number) => Math.round(subtotal * BANK.discountPct / 100);

export const MEDIA_BUCKET = "product-media";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
