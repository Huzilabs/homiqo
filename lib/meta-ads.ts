import "server-only";

/** Meta Marketing API (Ads Insights) — read-only reporting for the admin dashboard. */

const VERSION = process.env.META_API_VERSION || "v23.0";
const TOKEN = process.env.META_ACCESS_TOKEN;
const ACCOUNT = (process.env.META_AD_ACCOUNT_ID || "").replace(/^act_/, "");

export const metaAdsConfigured = () => Boolean(TOKEN && ACCOUNT);

type Action = { action_type: string; value: string };
interface RawRow {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  inline_link_clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: Action[];
  action_values?: Action[];
  date_start?: string;
  campaign_id?: string;
  campaign_name?: string;
}

export interface AdMetrics {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  linkClicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  landingViews: number;
  addToCart: number;
  checkouts: number;
  purchases: number;
  purchaseValue: number;
}

export interface DailyAds extends AdMetrics { date: string }
export interface CampaignAds extends AdMetrics { id: string; name: string }

// Meta reports the same conversion under several action types; prefer the de-duplicated "omni" one.
const pick = (list: Action[] | undefined, types: string[]) => {
  if (!list) return 0;
  for (const t of types) {
    const hit = list.find((a) => a.action_type === t);
    if (hit) return Number(hit.value) || 0;
  }
  return 0;
};
const PURCHASE = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"];
const ATC = ["omni_add_to_cart", "add_to_cart", "offsite_conversion.fb_pixel_add_to_cart"];
const CHECKOUT = ["omni_initiated_checkout", "initiate_checkout", "offsite_conversion.fb_pixel_initiate_checkout"];
const LPV = ["landing_page_view", "omni_landing_page_view"];

function parse(r: RawRow): AdMetrics {
  return {
    spend: Number(r.spend) || 0,
    impressions: Number(r.impressions) || 0,
    reach: Number(r.reach) || 0,
    clicks: Number(r.clicks) || 0,
    linkClicks: Number(r.inline_link_clicks) || 0,
    ctr: Number(r.ctr) || 0,
    cpc: Number(r.cpc) || 0,
    cpm: Number(r.cpm) || 0,
    frequency: Number(r.frequency) || 0,
    landingViews: pick(r.actions, LPV),
    addToCart: pick(r.actions, ATC),
    checkouts: pick(r.actions, CHECKOUT),
    purchases: pick(r.actions, PURCHASE),
    purchaseValue: pick(r.action_values, PURCHASE),
  };
}

const FIELDS = "spend,impressions,reach,clicks,inline_link_clicks,ctr,cpc,cpm,frequency,actions,action_values";

async function insights(params: Record<string, string>): Promise<RawRow[]> {
  const url = new URL(`${process.env.META_GRAPH_BASE || "https://graph.facebook.com"}/${VERSION}/act_${ACCOUNT}/insights`);
  Object.entries({ ...params, access_token: TOKEN! }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { next: { revalidate: 300 } });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error?.message || `Meta API error ${res.status}`);
  const rows: RawRow[] = json.data || [];
  // follow pagination (campaign / daily lists)
  let next: string | undefined = json.paging?.next;
  while (next && rows.length < 2000) {
    const page = await (await fetch(next, { next: { revalidate: 300 } })).json();
    rows.push(...(page.data || []));
    next = page.paging?.next;
  }
  return rows;
}

export async function getMetaAds(since: string, until: string) {
  const time_range = JSON.stringify({ since, until });
  const [total, daily, campaigns] = await Promise.all([
    insights({ fields: FIELDS, time_range, level: "account" }),
    insights({ fields: FIELDS, time_range, level: "account", time_increment: "1", limit: "500" }),
    insights({ fields: `campaign_id,campaign_name,${FIELDS}`, time_range, level: "campaign", limit: "200" }),
  ]);
  return {
    total: parse(total[0] || {}),
    daily: daily.map((r) => ({ date: r.date_start!, ...parse(r) })) as DailyAds[],
    campaigns: campaigns
      .map((r) => ({ id: r.campaign_id!, name: r.campaign_name || "Untitled campaign", ...parse(r) }))
      .sort((a, b) => b.spend - a.spend) as CampaignAds[],
  };
}
