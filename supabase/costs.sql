-- =====================================================================
--  Private buying prices (admin-only) and profit tracking
-- =====================================================================
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost       numeric(12,2) not null check (cost >= 0),
  updated_at timestamptz not null default now()
);
alter table public.product_costs enable row level security;
drop policy if exists "admins manage product costs" on public.product_costs;
create policy "admins manage product costs" on public.product_costs for all using (public.is_admin()) with check (public.is_admin());

alter table public.order_items add column if not exists unit_cost numeric(12,2);

-- Snapshot the buying price onto each order line so profit stays correct if costs change later
create or replace function public.order_item_cost()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.unit_cost is null and new.product_id is not null then
    select cost into new.unit_cost from product_costs where product_id = new.product_id;
  end if;
  return new;
end $$;
drop trigger if exists order_items_cost on public.order_items;
create trigger order_items_cost before insert on public.order_items
for each row execute function public.order_item_cost();
revoke all on function public.order_item_cost() from public, anon, authenticated;
