-- Real recent-order counts + Meta-ad timed offer
-- (the earlier automatic sale-end job was removed: prices are not raised automatically)

create or replace function public.recent_order_counts()
returns table(product_id uuid, orders bigint)
language sql stable security definer set search_path = public as $$
  select i.product_id, count(distinct o.id)
  from order_items i join orders o on o.id = i.order_id
  where o.created_at > now() - interval '7 days' and o.status <> 'cancelled' and i.product_id is not null
  group by i.product_id
$$;
grant execute on function public.recent_order_counts() to anon, authenticated;

alter table public.orders add column if not exists offer_discount numeric(12,2) not null default 0;

create table if not exists public.flash_offers (
  id uuid primary key default gen_random_uuid(), source text, created_at timestamptz not null default now(),
  expires_at timestamptz not null, used_at timestamptz, order_id uuid references public.orders(id) on delete set null);
alter table public.flash_offers enable row level security;

create or replace function public.start_flash_offer(p_source text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r flash_offers%rowtype;
begin
  insert into flash_offers (source, expires_at) values (left(coalesce(p_source, ''), 40), now() + interval '10 minutes') returning * into r;
  return jsonb_build_object('id', r.id, 'expires_at', r.expires_at);
end $$;
grant execute on function public.start_flash_offer(text) to anon, authenticated;
