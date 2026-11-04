import Link from "next/link";
import Stars from "@/components/Stars";
import ReviewActions from "@/components/admin/ReviewActions";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

const TABS = [
  { key: "pending", label: "Waiting for approval" },
  { key: "approved", label: "Live on website" },
  { key: "rejected", label: "Rejected / hidden" },
] as const;

type Row = {
  id: string; name: string; city: string | null; rating: number; comment: string; status: string; created_at: string;
  products: { name: string; slug: string } | null; orders: { order_number: string } | null;
};

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: s } = await searchParams;
  const status = TABS.some((t) => t.key === s) ? (s as string) : "pending";
  const supabase = await createClient();
  const [{ data }, ...counts] = await Promise.all([
    supabase.from("reviews").select("id, name, city, rating, comment, status, created_at, products(name, slug), orders(order_number)").eq("status", status).order("created_at", { ascending: false }),
    ...TABS.map((t) => supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", t.key)),
  ]);
  const rows = (data || []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Only customers with a delivered order can leave a review. Nothing appears on the website until you approve it.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TABS.map((t, i) => (
          <Link key={t.key} href={`/admin/reviews?status=${t.key}`} className={`border px-3 py-3 ${status === t.key ? "border-ink bg-ink text-white" : "border-ink/10 bg-white hover:border-ink/40"}`}>
            <span className={`block text-[11px] font-medium uppercase tracking-wider ${status === t.key ? "text-white/70" : t.key === "pending" && (counts[i].count || 0) > 0 ? "text-amber-700" : "text-gray-500"}`}>{t.label}</span>
            <span className="mt-1 block text-xl font-bold tabular-nums">{counts[i].count || 0}</span>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars rating={r.rating} />
                  <span className="font-semibold">{r.name}</span>
                  {r.city && <span className="text-sm text-gray-500">{r.city}</span>}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {r.products ? <a href={`/product/${r.products.slug}#reviews`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">{r.products.name}</a> : "Product removed"}
                  {r.orders && <> · order {r.orders.order_number}</>} · {formatDate(r.created_at)}
                </p>
                {r.comment ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-800">{r.comment}</p> : <p className="mt-3 text-sm italic text-gray-400">No written comment (rating only)</p>}
              </div>
              <ReviewActions id={r.id} status={r.status} />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="card p-10 text-center text-sm text-gray-500">
            {status === "pending" ? "No reviews waiting. After an order is delivered, use “Ask for a review” on the order page — the customer also gets the link by email." : "Nothing here yet."}
          </p>
        )}
      </div>
    </div>
  );
}
