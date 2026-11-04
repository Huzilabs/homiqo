import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { PRODUCTS_TAG, supabaseConfigured } from "./products";
import { STORE } from "./config";

export interface Review {
  id: string;
  product_id: string;
  name: string;
  city: string | null;
  rating: number;
  comment: string;
  verified: boolean;
  created_at: string;
}

export const REVIEWS_TAG = "reviews";

/** All approved reviews, cached across requests; refreshed when an admin approves/rejects (revalidateTag). */
const getAllApproved = unstable_cache(
  async (): Promise<Review[]> => {
    if (!supabaseConfigured) return [];
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await sb
      .from("reviews")
      .select("id, product_id, name, city, rating, comment, verified, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`reviews: ${error.message}`);
    return (data as Review[]) || [];
  },
  ["reviews-v1"],
  { tags: [REVIEWS_TAG, PRODUCTS_TAG], revalidate: 600 },
);

export async function getProductReviews(productId: string) {
  const all = await getAllApproved().catch(() => [] as Review[]);
  const reviews = all.filter((r) => r.product_id === productId);
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { reviews, count, average: Math.round(average * 10) / 10 };
}

/** Review link sent to customers after delivery */
export const reviewLink = (orderNumber: string, phone: string) =>
  `${STORE.siteUrl.replace(/\/$/, "")}/review/${encodeURIComponent(orderNumber)}?phone=${encodeURIComponent(phone)}`;
