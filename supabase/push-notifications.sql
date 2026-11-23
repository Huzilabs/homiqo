-- New-order push notifications for the Homiqo Admin app (applied 2026-11-23).
-- VAPID keys + hook secret live in Supabase Vault: push_vapid_public, push_vapid_private, push_hook_secret (never commit them).
-- Edge function: supabase/functions/order-push (verify_jwt = false; checks x-hook-secret).
create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique, p256dh text not null, auth text not null,
  user_id uuid references auth.users(id) on delete cascade, label text,
  created_at timestamptz not null default now(), last_used_at timestamptz
);
alter table public.push_subscriptions enable row level security;
create policy "admins manage push subs" on public.push_subscriptions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- public.push_config()        → service_role only: returns the VAPID keys + hook secret for the edge function
-- public.orders_push_notify() → AFTER INSERT trigger on orders: net.http_post(.../functions/v1/order-push, {order_id})
-- public.admin_push_test()    → admins: sends a test notification to every subscribed device
