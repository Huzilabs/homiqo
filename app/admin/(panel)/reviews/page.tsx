import Link from "next/link";
import Stars from "@/components/Stars";
import ReviewActions from "@/components/admin/ReviewActions";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import AskReviewButton from "@/components/admin/AskReviewButton";
import { reviewLink } from "@/lib/reviews";

const TABS = [
  { key: "pending", label: "Waiting for approval" },
  { key: "approved", label: "Live on website" },
  { key: "rejected", label: "Rejected / hidden" },
] as const;

type Row = {
  id: string; name: string; city: string | null; rating: number; comment: string; status: string; created_at: string; photo_url: string | null; verified: boolean;
  products: { name: string; slug: string } | null; orders: { order_number: string } | null;
};

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: s } = await searchParams;
  const status = TABS.some((t) => t.key === s) ? (s as string) : "pending";
  const supabase = await createClient();
  const [{ data }, ...counts] = await Promise.all([
    supabase.from("reviews").select("id, name, city, rating, comment, status, created_at, photo_url, verified, products(name, slug), orders(order_number)").eq("status", status).order("created_at", { ascending: false }),
    ...TABS.map((t) => supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", t.key)),
  ]);
  const rows = (data || []) as unknown as Row[];

  // Delivered customers (last 45 days) who haven't reviewed and haven't been asked yet
  const since = new Date(Date.now() - 45 * 864e5).toISOString();
  const [{ data: delivered }, { data: reviewed }] = await Promise.all([
    supabase.from("orders").select("id, order_number, customer_name, phone, city, created_at, order_items(product_name)").eq("status", "delivered").is("review_asked_at", null).gte("created_at", since).order("created_at", { ascending: false }).limit(60),
    supabase.from("reviews").select("order_id").not("order_id", "is", null),
  ]);
  const reviewedIds = new Set(((reviewed || []) as { order_id: string }[]).map((r) => r.order_id));
  const toAsk = ((delivered || []) as unknown as { id: string; order_number: string; customer_name: string; phone: string; city: string; order_items: { product_name: string }[] }[])
    .filter((o) => !reviewedIds.has(o.id))
    .slice(0, 30);
  const waTo = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("0") ? "92" + d.slice(1) : d; };
  const askText = (o: (typeof toAsk)[number]) =>
    `Assalam o Alaikum ${o.customer_name.split(" ")[0]}! Umeed hai aapko Homiqo ka ${o.order_items?.[0]?.product_name || "order"} pasand aaya 😊\n` +
    `Agar 1 minute ho to apna review zaroor dein — is se doosre customers ko bohat madad milti hai:\n${reviewLink(o.order_number, o.phone)}\n\nShukriya! — Team Homiqo`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Reviews come from delivered customers (verified) and from the product page (not verified). Nothing appears on the website until you approve it.
        </p>
      </div>

      {toAsk.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white">
          <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="font-semibold text-emerald-900">⭐ Ask for reviews · {toAsk.length} delivered customer{toAsk.length === 1 ? "" : "s"}</p>
            <p className="text-xs text-emerald-800/80">One tap opens WhatsApp with their personal review link. Best 1–2 days after delivery.</p>
          </div>
          <ul className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">
            {toAsk.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{o.customer_name}</span> <span className="text-gray-500">· {o.city} · {o.order_number}</span>
                  <span className="block truncate text-xs text-gray-500">{(o.order_items || []).map((i) => i.product_name).join(", ")}</span>
                </span>
                <AskReviewButton orderId={o.id} href={`https://wa.me/${waTo(o.phone)}?text=${encodeURIComponent(askText(o))}`} />
              </li>
            ))}
          </ul>
        </div>
      )}

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
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${r.verified ? "text-emerald-700" : "text-gray-400"}`}>{r.verified ? "✓ Verified buyer" : "Website review (not verified)"}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {r.products ? <a href={`/product/${r.products.slug}#reviews`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">{r.products.name}</a> : "Product removed"}
                  {r.orders && <> · order {r.orders.order_number}</>} · {formatDate(r.created_at)}
                </p>
                {r.comment ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-800">{r.comment}</p> : <p className="mt-3 text-sm italic text-gray-400">No written comment (rating only)</p>}
                {r.photo_url && (
                  <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.photo_url} alt={`Photo from ${r.name}`} className="h-28 w-28 border object-cover" />
                  </a>
                )}
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
