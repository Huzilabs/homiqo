-- =====================================================================
--  HomeCart store — Supabase schema
--  Run this whole file once in Supabase Dashboard → SQL Editor → New query
--  It is safe to re-run (idempotent where possible).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  category          text not null default 'Kitchen',
  short_description text not null default '',
  description       text not null default '',
  features          text[] not null default '{}',
  price             numeric(12,2) not null check (price >= 0),
  compare_at_price  numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  stock             integer not null default 0 check (stock >= 0),
  images            text[] not null default '{}',   -- public image URLs
  videos            text[] not null default '{}',   -- uploaded mp4/webm URLs or YouTube links
  is_active         boolean not null default true,
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (is_active, sort_order);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  customer_name   text not null,
  phone           text not null,
  email           text,
  address         text not null,
  city            text not null,
  notes           text,
  payment_method  text not null default 'cod',
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  tracking_number text,
  courier         text,
  subtotal        numeric(12,2) not null,
  shipping_fee    numeric(12,2) not null,
  total           numeric(12,2) not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  unit_price   numeric(12,2) not null,
  quantity     integer not null check (quantity > 0),
  line_total   numeric(12,2) not null
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Status timeline shown on the public tracking page
create table if not exists public.order_events (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- Log every status change; return stock to inventory when an order is cancelled
create or replace function public.on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into order_events (order_id, status, note) values (new.id, new.status, 'Order placed');
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into order_events (order_id, status) values (new.id, new.status);

    if new.status = 'cancelled' and old.status <> 'cancelled' then
      update products p set stock = p.stock + oi.quantity
      from order_items oi
      where oi.order_id = new.id and oi.product_id = p.id;
    elsif old.status = 'cancelled' and new.status <> 'cancelled' then
      update products p set stock = greatest(p.stock - oi.quantity, 0)
      from order_items oi
      where oi.order_id = new.id and oi.product_id = p.id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_status_ins on public.orders;
create trigger orders_status_ins after insert on public.orders
for each row execute function public.on_order_status_change();

drop trigger if exists orders_status_upd on public.orders;
create trigger orders_status_upd after update of status on public.orders
for each row execute function public.on_order_status_change();

-- ---------------------------------------------------------------------
-- place_order: the ONLY way customers create orders.
-- Prices, stock and totals are computed here on the server, so the
-- browser can never tamper with them.
--   Shipping: Rs 250, free for subtotal >= Rs 5000
--   (keep in sync with lib/config.ts)
-- ---------------------------------------------------------------------
create or replace function public.place_order(customer jsonb, items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id   uuid;
  v_number     text;
  v_subtotal   numeric(12,2) := 0;
  v_shipping   numeric(12,2);
  v_item       jsonb;
  v_qty        integer;
  v_product    products%rowtype;
  v_name       text := trim(coalesce(customer->>'customer_name', ''));
  v_phone      text := trim(coalesce(customer->>'phone', ''));
  v_address    text := trim(coalesce(customer->>'address', ''));
  v_city       text := trim(coalesce(customer->>'city', ''));
begin
  if length(v_name) < 2 then raise exception 'Please enter your full name'; end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 10 then raise exception 'Please enter a valid phone number'; end if;
  if length(v_address) < 5 then raise exception 'Please enter your complete address'; end if;
  if length(v_city) < 2 then raise exception 'Please enter your city'; end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if jsonb_array_length(items) > 50 then raise exception 'Too many items'; end if;

  -- unique, human friendly order number e.g. HC-7K3M9Q
  loop
    select 'HC-' || string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (floor(random() * 31) + 1)::int, 1), '')
      into v_number from generate_series(1, 6);
    exit when not exists (select 1 from orders where order_number = v_number);
  end loop;

  insert into orders (order_number, customer_name, phone, email, address, city, notes,
                      payment_method, subtotal, shipping_fee, total)
  values (v_number, v_name, v_phone, nullif(trim(customer->>'email'), ''), v_address, v_city,
          nullif(trim(customer->>'notes'), ''), 'cod', 0, 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty < 1 or v_qty > 20 then raise exception 'Invalid quantity'; end if;

    select * into v_product from products
    where id = (v_item->>'product_id')::uuid and is_active
    for update;

    if not found then raise exception 'A product in your cart is no longer available'; end if;
    if v_product.stock < v_qty then
      raise exception 'Only % left in stock for "%"', v_product.stock, v_product.name;
    end if;

    update products set stock = stock - v_qty where id = v_product.id;

    insert into order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.images[1], v_product.price, v_qty, v_product.price * v_qty);

    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  v_shipping := case when v_subtotal >= 5000 then 0 else 250 end;

  update orders set subtotal = v_subtotal, shipping_fee = v_shipping, total = v_subtotal + v_shipping
  where id = v_order_id;

  return jsonb_build_object('order_number', v_number, 'total', v_subtotal + v_shipping);
end $$;

-- ---------------------------------------------------------------------
-- track_order: public order lookup — requires order number AND phone
-- ---------------------------------------------------------------------
create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders
  where order_number = upper(trim(p_order_number))
    and right(regexp_replace(phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10);

  if not found then return null; end if;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'city', v_order.city,
    'status', v_order.status,
    'courier', v_order.courier,
    'tracking_number', v_order.tracking_number,
    'subtotal', v_order.subtotal,
    'shipping_fee', v_order.shipping_fee,
    'total', v_order.total,
    'payment_method', v_order.payment_method,
    'created_at', v_order.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
                 'product_name', product_name, 'product_image', product_image,
                 'unit_price', unit_price, 'quantity', quantity, 'line_total', line_total))
               from order_items where order_id = v_order.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('status', status, 'note', note, 'created_at', created_at)
                 order by created_at)
               from order_events where order_id = v_order.id), '[]'::jsonb)
  );
end $$;

revoke all on function public.place_order(jsonb, jsonb) from public;
revoke all on function public.track_order(text, text) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.admins       enable row level security;
alter table public.products     enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select using (is_active or public.is_admin());

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage order items" on public.order_items;
create policy "admins manage order items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage order events" on public.order_events;
create policy "admins manage order events" on public.order_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Storage bucket for product images & videos (public read, admin write)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do update set public = true;

drop policy if exists "public read product media" on storage.objects;
create policy "public read product media" on storage.objects
  for select using (bucket_id = 'product-media');

drop policy if exists "admins upload product media" on storage.objects;
create policy "admins upload product media" on storage.objects
  for insert with check (bucket_id = 'product-media' and public.is_admin());

drop policy if exists "admins update product media" on storage.objects;
create policy "admins update product media" on storage.objects
  for update using (bucket_id = 'product-media' and public.is_admin());

drop policy if exists "admins delete product media" on storage.objects;
create policy "admins delete product media" on storage.objects
  for delete using (bucket_id = 'product-media' and public.is_admin());

-- ---------------------------------------------------------------------
-- Seed: the 7 launch products (skipped if the slug already exists)
-- Upload real photos/videos for each from /admin/products afterwards.
-- ---------------------------------------------------------------------
insert into public.products
  (name, slug, category, short_description, description, features, price, compare_at_price, stock, is_featured, sort_order)
values
(
  'Kitchen Sink Organizer', 'kitchen-sink-organizer', 'Kitchen Storage',
  'Keep sponges, soap and brushes tidy with a self-draining sink caddy.',
  'Say goodbye to a cluttered, soggy sink. This organizer holds your dish soap, sponges, scrubbers and brushes in one place, while the built-in drain tray channels water straight back into the sink so nothing stays wet or smelly. Rust-proof, easy to clean and fits most sink sizes.',
  array['Self-draining tray keeps sponges dry','Rust-proof, food-safe material','Separate slots for soap, sponge & brush','Fits single and double sinks','Wipes clean in seconds'],
  2499, 3499, 60, true, 1
),
(
  'Coffee Maker', 'coffee-maker', 'Kitchen Appliances',
  'Fresh, aromatic coffee at home in minutes — one touch, no fuss.',
  'Brew café-style coffee in your own kitchen. With a reusable filter, keep-warm plate and anti-drip system, this coffee maker delivers rich, hot coffee for the whole family every morning. Compact design that fits any countertop.',
  array['Brews up to 6 cups at once','Anti-drip pause & serve','Keep-warm hot plate','Reusable washable filter','Auto shut-off for safety'],
  8999, 12499, 25, true, 2
),
(
  'Vegetable Slicer Cutter', 'vegetable-slicer-cutter', 'Kitchen Tools',
  'Slice, julienne and grate vegetables evenly in seconds.',
  'Prep salads, fries and garnishes like a pro. Interchangeable stainless-steel blades let you slice, julienne, grate and shred with consistent thickness every time. The hand guard keeps your fingers safe while you work.',
  array['Multiple interchangeable stainless blades','Hand guard for safe slicing','Non-slip base','Even, uniform cuts every time','Dishwasher-safe parts'],
  1899, 2799, 80, false, 3
),
(
  'Cordless Handheld Vacuum Cleaner', 'cordless-handheld-vacuum-cleaner', 'Home Cleaning',
  'Powerful, rechargeable vacuum for car, sofa and quick clean-ups.',
  'Clean anywhere without hunting for a socket. This lightweight cordless vacuum delivers strong suction for crumbs, dust and pet hair on sofas, car seats, curtains and keyboards. USB rechargeable with a washable filter and multiple nozzles.',
  array['Strong cyclonic suction','USB rechargeable — no cord needed','Washable, reusable HEPA filter','Crevice & brush nozzles included','Lightweight, one-hand use'],
  6499, 8999, 30, true, 4
),
(
  'Electric Food Chopper / Qeema Maker', 'electric-food-chopper-qeema-maker', 'Kitchen Appliances',
  'Make qeema, chop onions and grind masala in seconds.',
  'The everyday helper for desi kitchens. Mince meat for qeema, chop onions, tomatoes and garlic, or make chutneys in seconds — no tears, no mess. Sharp stainless-steel blades and a large bowl handle family-size portions.',
  array['Minces meat into qeema in seconds','4 sharp stainless-steel blades','Large capacity bowl','One-press operation','Safety lock lid'],
  4999, 6999, 40, true, 5
),
(
  'Multifunction Vegetable Chopper', 'multifunction-vegetable-chopper', 'Kitchen Tools',
  'Dice, chop and slice with one press — container catches everything.',
  'Cut your prep time in half. Place the vegetable, press the lid and get perfectly diced onions, tomatoes, cucumbers and more, collected neatly in the built-in container. Comes with multiple blade inserts for different cuts.',
  array['Dice, slice & chop with one press','Built-in collection container','Multiple blade inserts','Cleaning tool included','BPA-free food-grade plastic'],
  2999, 4199, 70, false, 6
),
(
  'Knife Sharpener', 'knife-sharpener', 'Kitchen Tools',
  'Restore a razor-sharp edge to dull knives in a few strokes.',
  'Bring your kitchen knives back to life. The 3-stage system repairs, sharpens and polishes the blade, while the non-slip base and ergonomic handle keep you safe and in control. Works on most steel kitchen knives.',
  array['3-stage: repair, sharpen & polish','Non-slip base for safety','Ergonomic handle','Works on most steel knives','Compact, easy to store'],
  1299, 1999, 100, false, 7
)
on conflict (slug) do nothing;

-- =====================================================================
-- MAKE YOURSELF ADMIN (run after creating your user in
-- Authentication → Users → Add user):
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
-- =====================================================================
