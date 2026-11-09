import Link from "next/link";
import LeadActions from "@/components/admin/LeadActions";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { STORE } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Abandoned checkouts" };

const TABS = [
  { key: "open", label: "To follow up" },
  { key: "contacted", label: "Contacted" },
  { key: "converted", label: "Ordered" },
  { key: "dismissed", label: "Dismissed" },
] as const;

type Lead = {
  id: string; customer_name: string | null; phone: string; city: string | null; address: string | null;
  items: { name: string; quantity: number; price: number }[]; subtotal: number; utm_campaign: string | null;
  status: string; created_at: string; updated_at: string; orders: { order_number: string } | null;
};

const waNumber = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.startsWith("92") ? d : d.startsWith("0") ? "92" + d.slice(1) : d.length === 10 ? "92" + d : d;
};
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AbandonedCheckouts({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: s } = await searchParams;
  const status = TABS.some((t) => t.key === s) ? (s as string) : "open";
  const supabase = await createClient();
  // Give customers 10 minutes to finish before they count as abandoned
  const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const base = () => supabase.from("checkout_leads").select("id", { count: "exact", head: true });
  const [{ data, error }, ...counts] = await Promise.all([
    (() => {
      const q = supabase
        .from("checkout_leads")
        .select("id, customer_name, phone, city, address, items, subtotal, utm_campaign, status, created_at, updated_at, orders(order_number)")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(200);
      return status === "open" ? q.lt("updated_at", cutoff) : q;
    })(),
    ...TABS.map((t) => (t.key === "open" ? base().eq("status", "open").lt("updated_at", cutoff) : base().eq("status", t.key))),
  ]);
  const rows = (data || []) as unknown as Lead[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Abandoned checkouts</h1>
        <p className="text-sm text-gray-500">
          People who entered their phone number at checkout but didn’t place the order. Message them on WhatsApp — many just need a nudge or have a question.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t, i) => (
          <Link
            key={t.key}
            href={`/admin/abandoned?status=${t.key}`}
            className={`border px-3 py-2 text-sm font-medium ${status === t.key ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"}`}
          >
            {t.label} <span className="ml-1 opacity-70">{counts[i].count ?? 0}</span>
          </Link>
        ))}
      </div>

      {error && <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load: {error.message}</div>}

      {rows.length === 0 ? (
        <p className="card p-6 text-sm text-gray-500">Nothing here right now.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((l) => {
            const first = (l.customer_name || "").split(" ")[0];
            const list = (l.items || []).map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ");
            const msg =
              `Assalam o Alaikum${first ? ` ${first}` : ""}! This is ${STORE.name}. ` +
              `Aapne humari website par ${list || "order"} order karna shuru kiya tha lekin complete nahi hua. ` +
              `Kya koi sawal hai ya hum aapka order confirm kar dein? 🚚 Free delivery · 💵 Cash on Delivery (parcel khol kar check kar sakte hain).`;
            const waHref = `https://wa.me/${waNumber(l.phone)}?text=${encodeURIComponent(msg)}`;
            return (
              <li key={l.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-gray-900">
                      {l.customer_name || "No name yet"} · <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="text-brand-700 hover:underline">{l.phone}</a>
                    </p>
                    <p className="text-sm text-gray-600">
                      {[l.city, l.address].filter(Boolean).join(" · ") || "No address yet"}
                    </p>
                    <p className="text-sm text-gray-800">
                      {list || "—"} · <b>{formatPrice(Number(l.subtotal))}</b>
                    </p>
                    <p className="text-xs text-gray-500">
                      {when(l.created_at)}
                      {l.utm_campaign && <> · from ad <b>{l.utm_campaign}</b></>}
                      {l.orders?.order_number && <> · ordered as <b>{l.orders.order_number}</b></>}
                    </p>
                  </div>
                  {l.status !== "converted" && <LeadActions id={l.id} status={l.status} waHref={waHref} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-gray-500">
        A lead is saved once a valid phone number is typed at checkout, and moves to “Ordered” automatically when that number places an order.
      </p>
    </div>
  );
}
