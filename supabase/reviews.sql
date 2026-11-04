-- Customer reviews: only from real, delivered orders (verified by order number + phone),
-- and only shown after an admin approves them.

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  name        text not null,
  city        text,
  rating      int  not null check (rating between 1 and 5),
  comment     text not null default '',
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified    boolean not null default true,
  created_at  timestamptz not null default now(),
  approved_at timestamptz,
  unique (order_id, product_id)
);
create index if not exists reviews_product_status on public.reviews (product_id, status);

alter table public.reviews enable row level security;
drop policy if exists "approved reviews are public" on public.reviews;
create policy "approved reviews are public" on public.reviews for select using (status = 'approved');
drop policy if exists "admins manage reviews" on public.reviews;
create policy "admins manage reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

-- What a customer sees on their review page: the products in their delivered order
create or replace function public.review_order(p_order_number text, p_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare o orders%rowtype;
begin
  select * into o from orders
  where order_number = upper(trim(p_order_number))
    and right(regexp_replace(phone, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  if not found then return null; end if;
  return jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'city', o.city,
    'status', o.status,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', i.product_id, 'product_name', i.product_name, 'product_image', i.product_image,
        'reviewed', exists (select 1 from reviews r where r.order_id = o.id and r.product_id = i.product_id)))
      from order_items i where i.order_id = o.id and i.product_id is not null), '[]'::jsonb));
end $$;

-- Submit a review: order must exist, match the phone, be delivered and contain the product
create or replace function public.submit_review(p_order_number text, p_phone text, p_product_id uuid, p_rating int, p_comment text, p_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare o orders%rowtype;
begin
  select * into o from orders
  where order_number = upper(trim(p_order_number))
    and right(regexp_replace(phone, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  if not found then return jsonb_build_object('ok', false, 'error', 'Order not found. Check the order number and phone number.'); end if;
  if o.status <> 'delivered' then return jsonb_build_object('ok', false, 'error', 'You can review your order once it has been delivered.'); end if;
  if not exists (select 1 from order_items where order_id = o.id and product_id = p_product_id) then
    return jsonb_build_object('ok', false, 'error', 'This product is not in your order.');
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then return jsonb_build_object('ok', false, 'error', 'Please choose a star rating.'); end if;
  if exists (select 1 from reviews where order_id = o.id and product_id = p_product_id) then
    return jsonb_build_object('ok', false, 'error', 'You have already reviewed this product. Thank you!');
  end if;
  insert into reviews (product_id, order_id, name, city, rating, comment)
  values (p_product_id, o.id,
          left(coalesce(nullif(trim(p_name), ''), split_part(o.customer_name, ' ', 1)), 60),
          o.city, p_rating, left(trim(coalesce(p_comment, '')), 1500));
  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.review_order(text, text) to anon, authenticated;
grant execute on function public.submit_review(text, text, uuid, int, text, text) to anon, authenticated;
