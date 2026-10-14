export const STORE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "HomeCart",
  tagline: "Smart kitchen & home essentials, delivered to your door",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  currency: "PKR",
};

// Keep in sync with public.place_order() in supabase/schema.sql
export const SHIPPING_FEE = 250;
export const FREE_SHIPPING_THRESHOLD = 5000;

export const shippingFor = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

export const MEDIA_BUCKET = "product-media";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
