-- Meta ad spend per day for the admin dashboard (applied 2026-11-14).
-- The Graph token lives in Supabase Vault as 'meta_ads_token' (never commit it):
--   select vault.create_secret('<token with ads_read>', 'meta_ads_token');
create table if not exists public.ad_spend_daily (
  day date primary key,
  spend numeric(12,2) not null default 0,
  impressions integer not null default 0,
  link_clicks integer not null default 0,
  meta_purchases integer not null default 0,
  synced_at timestamptz not null default now()
);
alter table public.ad_spend_daily enable row level security;
create policy "admins read ad spend" on public.ad_spend_daily for select to authenticated using (public.is_admin());

-- public.meta_ads_sync(p_days) pulls account insights (time_increment=1) for act_1469400392041921 and upserts ad_spend_daily.
-- Scheduled hourly: select cron.schedule('meta-ads-sync', '7 * * * *', $c$select public.meta_ads_sync(3)$c$);
