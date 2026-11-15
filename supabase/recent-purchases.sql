-- Public "X from City ordered Y" feed for the storefront popup (applied 2026-11-15).
-- Exposes only first name, city, product and time — never phone or address. Real, non-cancelled orders from the last 14 days.
create or replace function public.recent_purchases()
returns table (first_name text, city text, product_name text, product_slug text, product_image text, ordered_at timestamptz)
language sql stable security definer set search_path = public as $$
  select
    case when length(split_part(trim(o.customer_name), ' ', 1)) >= 3
         then initcap(split_part(trim(o.customer_name), ' ', 1)) else 'A customer' end,
    initcap(trim(o.city)),
    p.name, p.slug, p.images[1], o.created_at
  from orders o
  join lateral (select product_id from order_items oi where oi.order_id = o.id order by oi.line_total desc limit 1) i on true
  join products p on p.id = i.product_id and p.is_active
  where o.status <> 'cancelled' and o.created_at > now() - interval '14 days'
  order by o.created_at desc
  limit 12
$$;
revoke all on function public.recent_purchases() from public;
grant execute on function public.recent_purchases() to anon, authenticated;
