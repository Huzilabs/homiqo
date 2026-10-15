import Link from "next/link";
import TrendChart, { type TrendPoint } from "@/components/admin/TrendChart";
import { createClient } from "@/lib/supabase/server";
import { getMetaAds, metaAdsConfigured, type AdMetrics, type CampaignAds } from "@/lib/meta-ads";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketing" };

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "lastmonth", label: "Last month" },
  { key: "90d", label: "Last 90 days" },
] as const;

/** Dates in Pakistan time (UTC+5), as YYYY-MM-DD. */
const pkToday = () => new Date(Date.now() + 5 * 3600e3);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);

function resolveRange(key: string) {
  const t = pkToday();
  switch (key) {
    case "today": return { since: iso(t), until: iso(t) };
    case "yesterday": return { since: iso(addDays(t, -1)), until: iso(addDays(t, -1)) };
    case "30d": return { since: iso(addDays(t, -29)), until: iso(t) };
    case "90d": return { since: iso(addDays(t, -89)), until: iso(t) };
    case "month": return { since: iso(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1))), until: iso(t) };
    case "lastmonth": {
      const first = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1));
      const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0));
      return { since: iso(first), until: iso(last) };
    }
    default: return { since: iso(addDays(t, -6)), until: iso(t) };
  }
}

const rs = (n: number) => "Rs " + Math.round(n).toLocaleString("en-PK");
const num = (n: number) => Math.round(n).toLocaleString("en-PK");
const pct = (n: number) => `${n.toFixed(2)}%`;
const ratio = (a: number, b: number) => (b > 0 ? a / b : 0);

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "7d" } = await searchParams;
  const { since, until } = resolveRange(range);

  // ── Store data (source of truth for revenue & orders)
  const supabase = await createClient();
  const { data: orderRows } = await supabase
    .from("orders")
    .select("total, created_at, status")
    .gte("created_at", `${since}T00:00:00+05:00`)
    .lt("created_at", `${iso(addDays(new Date(until + "T00:00:00Z"), 1))}T00:00:00+05:00`)
    .neq("status", "cancelled");
  const orders = (orderRows || []) as { total: number; created_at: string }[];
  const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const aov = ratio(revenue, orders.length);

  // ── Meta Ads
  let ads: Awaited<ReturnType<typeof getMetaAds>> | null = null;
  let adsError: string | null = null;
  if (metaAdsConfigured()) {
    try {
      ads = await getMetaAds(since, until);
    } catch (e) {
      adsError = e instanceof Error ? e.message : "Could not load Meta Ads data";
    }
  }
  const m: AdMetrics | null = ads?.total ?? null;
  const spend = m?.spend ?? 0;

  // ── Daily series
  const days: TrendPoint[] = [];
  for (let d = new Date(since + "T00:00:00Z"); iso(d) <= until; d = addDays(d, 1)) days.push({ date: iso(d), revenue: 0, spend: 0, orders: 0 });
  const byDate = new Map(days.map((d) => [d.date, d]));
  orders.forEach((o) => {
    const key = iso(new Date(new Date(o.created_at).getTime() + 5 * 3600e3));
    const row = byDate.get(key);
    if (row) { row.revenue += Number(o.total); row.orders += 1; }
  });
  ads?.daily.forEach((d) => { const row = byDate.get(d.date); if (row) row.spend = d.spend; });

  const kpis: { label: string; value: string; hint: string; tone?: "good" | "bad" }[] = [
    { label: "Ad spend", value: m ? rs(spend) : "—", hint: "Meta Ads" },
    { label: "Store revenue", value: rs(revenue), hint: `${orders.length} orders` },
    { label: "Blended ROAS", value: spend ? `${ratio(revenue, spend).toFixed(2)}×` : "—", hint: "Store revenue ÷ ad spend", tone: spend ? (revenue / spend >= 2 ? "good" : "bad") : undefined },
    { label: "Cost per order", value: spend && orders.length ? rs(spend / orders.length) : "—", hint: "Ad spend ÷ store orders" },
    { label: "Cost per purchase", value: m?.purchases ? rs(spend / m.purchases) : "—", hint: `${num(m?.purchases ?? 0)} Meta-attributed purchases` },
    { label: "Meta ROAS", value: spend && m?.purchaseValue ? `${ratio(m.purchaseValue, spend).toFixed(2)}×` : "—", hint: m ? `${rs(m.purchaseValue)} purchase value` : "Purchase value ÷ spend" },
    { label: "Avg. order value", value: orders.length ? rs(aov) : "—", hint: "Store" },
    { label: "CPC (link)", value: m?.linkClicks ? rs(spend / m.linkClicks) : "—", hint: `${num(m?.linkClicks ?? 0)} link clicks` },
    { label: "CTR", value: m ? pct(m.ctr) : "—", hint: "Clicks ÷ impressions" },
    { label: "CPM", value: m ? rs(m.cpm) : "—", hint: "Cost per 1,000 impressions" },
    { label: "Reach", value: m ? num(m.reach) : "—", hint: m ? `Frequency ${m.frequency.toFixed(2)}` : "Unique people" },
    { label: "Impressions", value: m ? num(m.impressions) : "—", hint: "Meta Ads" },
  ];

  const funnel = m
    ? [
        { label: "Impressions", v: m.impressions },
        { label: "Link clicks", v: m.linkClicks },
        { label: "Landing page views", v: m.landingViews },
        { label: "Adds to cart", v: m.addToCart },
        { label: "Checkouts started", v: m.checkouts },
        { label: "Purchases", v: m.purchases },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Marketing</h1>
          <p className="text-sm text-gray-500">Meta Ads performance against real store orders · {since === until ? since : `${since} → ${until}`}</p>
        </div>
      </div>

      {/* Filters — one row above everything */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/admin/marketing?range=${r.key}`}
            className={`whitespace-nowrap border px-3.5 py-1.5 text-sm font-medium ${range === r.key ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {!metaAdsConfigured() && <SetupCard />}
      {adsError && (
        <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <b>Meta Ads error:</b> {adsError}
          <p className="mt-1 text-rose-700">Check that META_ACCESS_TOKEN is valid (tokens can expire) and has the <code>ads_read</code> permission for this ad account.</p>
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-px overflow-hidden border border-gray-200 bg-gray-200 md:grid-cols-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[.14em] text-gray-500">{k.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {k.value}
              {k.tone && <span className={`ml-2 align-middle text-xs font-semibold ${k.tone === "good" ? "text-emerald-700" : "text-amber-700"}`}>{k.tone === "good" ? "▲ profitable" : "▼ below 2×"}</span>}
            </p>
            <p className="mt-1 text-xs text-gray-500">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Trend */}
      <div className="card p-5">
        <p className="mb-1 font-bold">Revenue vs ad spend</p>
        <p className="mb-4 text-xs text-gray-500">Daily, Pakistan time. Hover for details.</p>
        <TrendChart data={days} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        {/* Funnel */}
        <div className="card p-5">
          <p className="font-bold">Ad funnel</p>
          <p className="mb-5 text-xs text-gray-500">From people seeing your ads to purchases (Meta Pixel events)</p>
          {funnel.length ? (
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
                        {i > 0 && <span className="ml-2 text-xs font-normal text-gray-500">{prev ? pct((f.v / prev) * 100) : "—"}</span>}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 bg-gray-100">
                      <div className="h-full" style={{ width: `${Math.max(f.v ? 1.5 : 0, (f.v / top) * 100)}%`, background: "#0F9A92", opacity: 1 - i * 0.12 }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Connect Meta Ads to see the funnel.</p>
          )}
        </div>

        {/* Campaigns */}
        <div className="card overflow-hidden">
          <div className="border-b p-5">
            <p className="font-bold">Campaigns</p>
            <p className="text-xs text-gray-500">Sorted by spend</p>
          </div>
          <CampaignTable rows={ads?.campaigns ?? []} />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-gray-500">
        <b>Blended</b> metrics use your actual store orders (every order, from any source). <b>Meta</b> metrics use purchases Meta attributes to your ads via the Pixel,
        which can differ because of attribution windows, ad blockers and iOS privacy settings. Meta data refreshes every 5 minutes.
      </p>
    </div>
  );
}

function CampaignTable({ rows }: { rows: CampaignAds[] }) {
  if (!rows.length) return <p className="p-5 text-sm text-gray-500">No campaign activity in this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] whitespace-nowrap text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3 text-right">Spend</th>
            <th className="px-4 py-3 text-right">CTR</th>
            <th className="px-4 py-3 text-right">CPC</th>
            <th className="px-4 py-3 text-right">Purchases</th>
            <th className="px-4 py-3 text-right">Cost / purchase</th>
            <th className="px-4 py-3 text-right">ROAS</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="max-w-[220px] truncate px-4 py-3 font-medium" title={c.name}>{c.name}</td>
              <td className="px-4 py-3 text-right">{rs(c.spend)}</td>
              <td className="px-4 py-3 text-right">{pct(c.ctr)}</td>
              <td className="px-4 py-3 text-right">{c.linkClicks ? rs(c.spend / c.linkClicks) : "—"}</td>
              <td className="px-4 py-3 text-right">{num(c.purchases)}</td>
              <td className="px-4 py-3 text-right">{c.purchases ? rs(c.spend / c.purchases) : "—"}</td>
              <td className="px-4 py-3 text-right font-semibold">{c.spend ? `${(c.purchaseValue / c.spend).toFixed(2)}×` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SetupCard() {
  return (
    <div className="border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">Connect Meta Ads to see spend, cost per purchase and ROAS</p>
      <p className="mt-1">
        Add <code>META_ACCESS_TOKEN</code> and <code>META_AD_ACCOUNT_ID</code> in Vercel → Settings → Environment Variables, then redeploy. Store revenue and orders below already work.
      </p>
    </div>
  );
}
