import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { getMetaAds, metaAdsConfigured } from "@/lib/meta-ads";

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;
const POSTEX_EST = 240; // usual fee + tax per parcel when PostEx hasn't reported the real one yet
const STOP = new Set(["electric", "machine", "portable", "with", "and", "for", "the", "kitchen", "rechargeable", "homiqo", "sales", "set", "sets", "ad", "budget", "broad", "retargeting"]);
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));

type Line = { product_id: string | null; product_name: string; quantity: number; line_total: number; unit_cost: number | null };
type O = {
  id: string; status: string; total: number; postex_status: string | null; tracking_number: string | null; created_at: string;
  fee: string | null; tax: string | null; rfee: string | null; rtax: string | null; order_items: Line[];
};
type Row = {
  id: string; name: string; orders: number; delivered: number; returned: number; open: number;
  revenue: number; cost: number; courier: number; ads: number; units: number;
};

const pkDay = (d: Date) => new Date(d.getTime() + 5 * 3600e3).toISOString().slice(0, 10);

export default async function Profit({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: dParam } = await searchParams;
  const days = (RANGES as readonly number[]).includes(Number(dParam)) ? Number(dParam) : 30;
  const since = new Date(Date.now() - days * 864e5);
  const supabase = await createClient();

  const [{ data: orderRows }, { data: products }, ads] = await Promise.all([
    supabase
      .from("orders")
      .select("id,status,total,postex_status,tracking_number,created_at,fee:postex_history->>transactionFee,tax:postex_history->>transactionTax,rfee:postex_history->>reversalFee,rtax:postex_history->>reversalTax,order_items(product_id,product_name,quantity,line_total,unit_cost)")
      .gte("created_at", since.toISOString()),
    supabase.from("products").select("id,name"),
    metaAdsConfigured() ? getMetaAds(pkDay(since), pkDay(new Date())).catch(() => null) : Promise.resolve(null),
  ]);

  const rows = new Map<string, Row>();
  const row = (id: string, name: string) => {
    if (!rows.has(id)) rows.set(id, { id, name, orders: 0, delivered: 0, returned: 0, open: 0, revenue: 0, cost: 0, courier: 0, ads: 0, units: 0 });
    return rows.get(id)!;
  };
  for (const p of (products || []) as { id: string; name: string }[]) row(p.id, p.name);

  // orders → per product (multi-product orders are split by each line's share of the order)
  for (const o of (orderRows || []) as unknown as O[]) {
    const lines = o.order_items || [];
    const sum = lines.reduce((s, l) => s + Number(l.line_total), 0) || 1;
    const delivered = o.status === "delivered";
    const returned = /^return/i.test(o.postex_status || "");
    const open = ["pending", "confirmed", "shipped"].includes(o.status) && !returned;
    const realFee = [o.fee, o.tax, o.rfee, o.rtax].reduce((s, v) => s + (Number(v) || 0), 0);
    const courier = delivered || returned ? (realFee > 0 ? realFee : o.tracking_number ? POSTEX_EST : 0) : 0;
    for (const l of lines) {
      const share = Number(l.line_total) / sum;
      const r = row(l.product_id || l.product_name, l.product_name);
      if (o.status !== "cancelled" || returned) r.orders += share;
      if (delivered) {
        r.delivered += share;
        r.units += l.quantity;
        r.revenue += Number(o.total) * share;
        r.cost += Number(l.unit_cost || 0) * l.quantity;
      }
      if (returned) r.returned += share;
      if (open) r.open += share;
      r.courier += courier * share;
    }
  }

  // Meta ad spend → product whose name matches the campaign name best
  let unmatched = 0;
  const list = [...rows.values()];
  for (const c of ads?.campaigns || []) {
    if (!c.spend) continue;
    const cw = new Set(words(c.name));
    let best: Row | null = null, score = 0;
    for (const r of list) {
      const s = words(r.name).filter((w) => cw.has(w)).length;
      if (s > score) { score = s; best = r; }
    }
    if (best) best.ads += c.spend; else unmatched += c.spend;
  }

  const shown = list
    .map((r) => ({ ...r, profit: r.revenue - r.cost - r.courier - r.ads }))
    .filter((r) => r.orders > 0.01 || r.ads > 0)
    .sort((a, b) => b.revenue - a.revenue);
  const tot = shown.reduce((t, r) => ({ revenue: t.revenue + r.revenue, cost: t.cost + r.cost, courier: t.courier + r.courier, ads: t.ads + r.ads, profit: t.profit + r.profit, delivered: t.delivered + r.delivered }), { revenue: 0, cost: 0, courier: 0, ads: 0, profit: 0, delivered: 0 });
  const totProfit = tot.profit - unmatched;
  const rs = (n: number) => formatPrice(Math.round(n));
  const n1 = (n: number) => (Math.round(n * 10) / 10).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Profit per product</h1>
          <p className="text-[13px] text-gray-500">Orders placed in the last {days} days. Profit = delivered sales − product cost − PostEx charges − Meta ads.</p>
        </div>
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white text-[13px] font-medium shadow-sm">
          {RANGES.map((d) => (
            <Link key={d} href={`/admin/profit?days=${d}`} className={`px-3 py-1.5 ${d === days ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>{d} days</Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Delivered sales", v: rs(tot.revenue) },
          { l: "Product cost + PostEx", v: rs(tot.cost + tot.courier) },
          { l: "Meta ads", v: rs(tot.ads + unmatched) },
          { l: "Net profit", v: rs(totProfit), tone: totProfit < 0 ? "text-rose-600" : "text-emerald-700", hint: tot.delivered ? `${rs(totProfit / tot.delivered)} per delivered order` : "" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{k.l}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${k.tone || "text-gray-900"}`}>{k.v}</p>
            {k.hint && <p className="text-[11px] text-gray-500">{k.hint}</p>}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-3 py-2.5 text-right font-medium">Orders</th>
              <th className="px-3 py-2.5 text-right font-medium">Delivered</th>
              <th className="px-3 py-2.5 text-right font-medium">Returned</th>
              <th className="px-3 py-2.5 text-right font-medium">Delivery rate</th>
              <th className="px-3 py-2.5 text-right font-medium">Sales</th>
              <th className="px-3 py-2.5 text-right font-medium">Cost</th>
              <th className="px-3 py-2.5 text-right font-medium">PostEx</th>
              <th className="px-3 py-2.5 text-right font-medium">Ads</th>
              <th className="px-3 py-2.5 text-right font-medium">Profit</th>
              <th className="px-4 py-2.5 text-right font-medium">Per delivered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shown.map((r) => {
              const finished = r.delivered + r.returned;
              const rate = finished > 0 ? Math.round((r.delivered / finished) * 100) : null;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{r.name}{r.open > 0.5 && <span className="ml-1.5 text-[11px] font-normal text-gray-500">· {n1(r.open)} on the way</span>}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{n1(r.orders)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{n1(r.delivered)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{n1(r.returned)}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${rate != null && rate < 70 ? "font-semibold text-rose-600" : ""}`}>{rate == null ? "—" : `${rate}%`}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{rs(r.revenue)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">{rs(r.cost)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">{rs(r.courier)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">{rs(r.ads)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold tabular-nums ${r.profit < 0 ? "text-rose-600" : "text-emerald-700"}`}>{rs(r.profit)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.delivered >= 0.5 ? rs(r.profit / r.delivered) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Ads are matched to products by campaign name{unmatched > 0 ? ` (${rs(unmatched)} from campaigns that don't name a product is only in the total)` : ""}.
        PostEx uses the real fee once a parcel is delivered or returned, else {formatPrice(POSTEX_EST)}. Orders still on the way count once they&apos;re delivered or returned.
        {!ads && " Meta ads couldn't be loaded right now."}
      </p>
    </div>
  );
}
