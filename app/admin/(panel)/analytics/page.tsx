import Link from "next/link";
import RangeFilter from "@/components/admin/RangeFilter";
import TrendChart from "@/components/admin/TrendChart";
import { CHART_COLORS } from "@/lib/chart-colors";
import { createClient } from "@/lib/supabase/server";
import { eachDay, pkBounds, resolveRange } from "@/lib/date-range";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

interface Summary {
  visitors: number;
  sessions: number;
  pageviews: number;
  bounce_sessions: number;
  live: number;
  funnel: { sessions: number; view_item: number; add_to_cart: number; begin_checkout: number; purchase: number };
  daily: { date: string; visitors: number; sessions: number; pageviews: number }[];
  pages: { path: string; views: number; visitors: number }[];
  sources: { source: string; sessions: number }[];
  devices: { device: string; sessions: number }[];
  countries: { country: string; sessions: number }[];
  products: { name: string; slug: string; views: number; carts: number }[];
}

const num = (n: number) => Math.round(n).toLocaleString("en-PK");
const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—");
const rs = (n: number) => "Rs " + Math.round(n).toLocaleString("en-PK");
const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return (c: string) => (c && c !== "??" ? dn.of(c) || c : "Unknown");
  } catch {
    return (c: string) => c;
  }
})();
const PAGE_NAME = (p: string) =>
  p === "/" ? "Home" : p === "/shop" ? "Shop" : p.startsWith("/product/") ? `Product · ${p.slice(9).replace(/-/g, " ")}` : p.startsWith("/order/") ? "Order confirmation" : p.replace(/^\//, "").replace(/-/g, " ") || p;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "7d" } = await searchParams;
  const { since, until } = resolveRange(range);
  const { from, to } = pkBounds(since, until);
  const supabase = await createClient();

  const [{ data, error }, { data: orderRows }] = await Promise.all([
    supabase.rpc("analytics_summary", { p_from: from, p_to: to }),
    supabase.from("orders").select("total").gte("created_at", from).lt("created_at", to).neq("status", "cancelled"),
  ]);
  const s = (data || {}) as Summary;
  const orders = orderRows?.length || 0;
  const revenue = (orderRows || []).reduce((a, o) => a + Number(o.total), 0);

  const byDate = new Map((s.daily || []).map((d) => [d.date, d]));
  const days = eachDay(since, until).map((date) => ({ date, visitors: byDate.get(date)?.visitors || 0, pageviews: byDate.get(date)?.pageviews || 0, sessions: byDate.get(date)?.sessions || 0 }));

  const kpis = [
    { label: "Visitors", value: num(s.visitors || 0), hint: "Unique people" },
    { label: "Sessions", value: num(s.sessions || 0), hint: "Visits (30-min gap = new visit)" },
    { label: "Page views", value: num(s.pageviews || 0), hint: s.sessions ? `${(s.pageviews / s.sessions).toFixed(1)} pages per visit` : "—" },
    { label: "Bounce rate", value: pct(s.bounce_sessions || 0, s.sessions || 0), hint: "Visits that viewed one page" },
    { label: "Conversion rate", value: pct(s.funnel?.purchase || 0, s.sessions || 0), hint: "Visits that placed an order" },
    { label: "Add-to-cart rate", value: pct(s.funnel?.add_to_cart || 0, s.sessions || 0), hint: "Visits with an add to cart" },
    { label: "Orders", value: num(orders), hint: "Excluding cancelled" },
    { label: "Revenue", value: rs(revenue), hint: orders ? `${rs(revenue / orders)} average order` : "—" },
  ];

  const funnel = s.funnel
    ? [
        { label: "Visits", v: s.funnel.sessions },
        { label: "Viewed a product", v: s.funnel.view_item },
        { label: "Added to cart", v: s.funnel.add_to_cart },
        { label: "Started checkout", v: s.funnel.begin_checkout },
        { label: "Placed an order", v: s.funnel.purchase },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Analytics</h1>
          <p className="text-sm text-gray-500">Store visitors and shopping behaviour · {since === until ? since : `${since} → ${until}`}</p>
        </div>
        <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" /></span>
          {num(s.live || 0)} {s.live === 1 ? "visitor" : "visitors"} right now
        </span>
      </div>

      <RangeFilter base="/admin/analytics" active={range} />

      {error && <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Could not load analytics: {error.message}</div>}

      <div className="grid grid-cols-2 gap-px overflow-hidden border border-gray-200 bg-gray-200 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[.14em] text-gray-500">{k.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="mt-1 text-xs text-gray-500">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <p className="mb-1 font-bold">Visitors &amp; page views</p>
        <p className="mb-4 text-xs text-gray-500">Daily, Pakistan time. Hover for details.</p>
        <TrendChart
          data={days}
          format="number"
          label="Daily visitors and page views"
          series={[
            { key: "visitors", label: "Visitors", color: CHART_COLORS[0] },
            { key: "pageviews", label: "Page views", color: CHART_COLORS[1] },
          ]}
          extra={[{ key: "sessions", label: "Sessions" }]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <BarList title="Traffic sources" subtitle="Where visits came from" rows={(s.sources || []).map((r) => ({ label: r.source, v: r.sessions }))} />
        <BarList title="Devices" subtitle="Visits by device" rows={(s.devices || []).map((r) => ({ label: r.device[0].toUpperCase() + r.device.slice(1), v: r.sessions }))} />
        <BarList title="Countries" subtitle="Visits by country" rows={(s.countries || []).map((r) => ({ label: regionName(r.country), v: r.sessions }))} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="card p-5">
          <p className="font-bold">Shopping funnel</p>
          <p className="mb-5 text-xs text-gray-500">Visits that reached each step</p>
          <ul className="space-y-3.5">
            {funnel.map((f, i) => {
              const top = funnel[0].v || 1;
              const prev = i ? funnel[i - 1].v : 0;
              return (
                <li key={f.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-gray-700">{f.label}</span>
                    <span className="font-semibold text-gray-900">
                      {num(f.v)}
                      {i > 0 && <span className="ml-2 text-xs font-normal text-gray-500">{pct(f.v, prev)}</span>}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 bg-gray-100">
                    <div className="h-full" style={{ width: `${Math.max(f.v ? 1.5 : 0, (f.v / top) * 100)}%`, background: CHART_COLORS[0], opacity: 1 - i * 0.12 }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b p-5">
            <p className="font-bold">Top products</p>
            <p className="text-xs text-gray-500">Most viewed product pages</p>
          </div>
          <Table
            empty="No product views yet."
            head={["Product", "Views", "Added to cart", "Cart rate"]}
            rows={(s.products || []).map((p) => [
              <Link key="n" href={`/product/${p.slug}`} target="_blank" className="font-medium hover:underline">{p.name}</Link>,
              num(p.views),
              num(p.carts),
              pct(p.carts, p.views),
            ])}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b p-5">
          <p className="font-bold">Top pages</p>
          <p className="text-xs text-gray-500">Most visited pages</p>
        </div>
        <Table
          empty="No visits recorded yet."
          head={["Page", "Views", "Visitors"]}
          rows={(s.pages || []).map((p) => [<span key="p" className="capitalize">{PAGE_NAME(p.path)}<span className="ml-2 text-xs normal-case text-gray-400">{p.path}</span></span>, num(p.views), num(p.visitors)])}
        />
      </div>

      <p className="text-xs leading-relaxed text-gray-500">
        Visits are recorded by the store itself (admin pages and bots are excluded). Google Analytics, Meta Pixel and Microsoft Clarity also collect data in their own dashboards and may show slightly different numbers.
      </p>
    </div>
  );
}

function BarList({ title, subtitle, rows }: { title: string; subtitle: string; rows: { label: string; v: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  const total = rows.reduce((a, r) => a + r.v, 0);
  return (
    <div className="card p-5">
      <p className="font-bold">{title}</p>
      <p className="mb-4 text-xs text-gray-500">{subtitle}</p>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-gray-700">{r.label}</span>
                <span className="shrink-0 font-semibold text-gray-900">
                  {num(r.v)} <span className="ml-1 text-xs font-normal text-gray-500">{pct(r.v, total)}</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 bg-gray-100">
                <div className="h-full" style={{ width: `${(r.v / max) * 100}%`, background: CHART_COLORS[0] }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No data yet.</p>
      )}
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="p-5 text-sm text-gray-500">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] whitespace-nowrap text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>{head.map((h, i) => <th key={h} className={`px-4 py-3 ${i ? "text-right" : ""}`}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {r.map((c, j) => <td key={j} className={`px-4 py-3 ${j ? "text-right" : ""}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
