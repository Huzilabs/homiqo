-- Abandoned checkouts: saved as soon as a customer types a valid phone number at checkout.
-- Admin sees leads that never became orders and can follow up on WhatsApp.

create table if not exists public.checkout_leads (
  id            uuid primary key,                     -- generated in the browser, one per checkout visit
  session_id    text,
  customer_name text,
  phone         text not null,
  city          text,
  address       text,
  items         jsonb not null default '[]'::jsonb,   -- [{product_id, name, quantity, price}]
  subtotal      numeric(12,2) not null default 0,
  utm_campaign  text,
  status        text not null default 'open' check (status in ('open', 'contacted', 'converted', 'dismissed')),
  order_id      uuid references public.orders(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists checkout_leads_phone on public.checkout_leads (right(regexp_replace(phone, '\D', '', 'g'), 10));
create index if not exists checkout_leads_status_created on public.checkout_leads (status, created_at desc);

alter table public.checkout_leads enable row level security;
drop policy if exists "admins manage checkout leads" on public.checkout_leads;
create policy "admins manage checkout leads" on public.checkout_leads for all using (public.is_admin()) with check (public.is_admin());

-- Called from the checkout page (anon). Upserts by the browser's lead id; never overwrites a converted lead.
create or replace function public.save_checkout_lead(p_id uuid, p_lead jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_phone text := left(trim(coalesce(p_lead->>'phone', '')), 20);
begin
  if p_id is null or length(regexp_replace(v_phone, '\D', '', 'g')) < 10 then return; end if;
  insert into checkout_leads (id, session_id, customer_name, phone, city, address, items, subtotal, utm_campaign)
  values (p_id, left(p_lead->>'session_id', 64), left(nullif(trim(p_lead->>'customer_name'), ''), 80), v_phone,
          left(nullif(trim(p_lead->>'city'), ''), 60), left(nullif(trim(p_lead->>'address'), ''), 300),
          coalesce(case when jsonb_typeof(p_lead->'items') = 'array' then p_lead->'items' end, '[]'::jsonb),
          coalesce((p_lead->>'subtotal')::numeric, 0), left(nullif(p_lead->>'utm_campaign', ''), 120))
  on conflict (id) do update set
    customer_name = coalesce(excluded.customer_name, checkout_leads.customer_name),
    phone = excluded.phone,
    city = coalesce(excluded.city, checkout_leads.city),
    address = coalesce(excluded.address, checkout_leads.address),
    items = excluded.items,
    subtotal = excluded.subtotal,
    updated_at = now()
  where checkout_leads.status <> 'converted';
end $$;
grant execute on function public.save_checkout_lead(uuid, jsonb) to anon, authenticated;

-- When an order is placed, mark that phone's recent leads as converted
create or replace function public.checkout_leads_mark_converted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update checkout_leads set status = 'converted', order_id = new.id, updated_at = now()
  where status in ('open', 'contacted')
    and created_at > now() - interval '7 days'
    and right(regexp_replace(phone, '\D', '', 'g'), 10) = right(regexp_replace(new.phone, '\D', '', 'g'), 10);
  return new;
end $$;
drop trigger if exists orders_mark_checkout_leads on public.orders;
create trigger orders_mark_checkout_leads after insert on public.orders
  for each row execute function public.checkout_leads_mark_converted();
