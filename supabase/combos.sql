-- Combo products: a product whose `components` lists other products sold together at a lower price.
--  * Buying the combo product reduces the stock of each component (the combo's own stock mirrors the lowest component).
--  * Buying all components separately in one order gives the same combo price automatically (combo_discount).
alter table public.products add column if not exists components uuid[];
alter table public.orders add column if not exists combo_discount numeric(12,2) not null default 0;

-- Keep each combo's stock = lowest stock among its components
create or replace function public.sync_combo_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(array_length(new.components, 1), 0) = 0 then
    update products c set stock = (select coalesce(min(p.stock), 0) from products p where p.id = any(c.components))
    where c.components @> array[new.id];
  end if;
  return new;
end $$;
drop trigger if exists products_sync_combo_stock on public.products;
create trigger products_sync_combo_stock after insert or update of stock on public.products
  for each row when (pg_trigger_depth() < 1) execute function public.sync_combo_stock();

create or replace function public.place_order(customer jsonb, items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order_id   uuid;
  v_number     text;
  v_subtotal   numeric(12,2) := 0;
  v_shipping   numeric(12,2);
  v_discount   numeric(12,2) := 0;
  v_units      integer := 0;
  v_offer_disc numeric(12,2) := 0;
  v_bundle     numeric(12,2) := 0;
  v_combo      numeric(12,2) := 0;
  v_offer_id   uuid;
  v_item       jsonb;
  v_qty        integer;
  v_product    products%rowtype;
  v_comp       products%rowtype;
  v_cid        uuid;
  v_qmap       jsonb := '{}'::jsonb;   -- product_id -> quantity (single products only)
  v_bmap       jsonb := '{}'::jsonb;   -- product_id -> bundle_save
  v_c          record;
  v_n          integer;
  v_name       text := trim(coalesce(customer->>'customer_name', ''));
  v_phone      text := trim(coalesce(customer->>'phone', ''));
  v_address    text := trim(coalesce(customer->>'address', ''));
  v_city       text := trim(coalesce(customer->>'city', ''));
  v_payment    text := case when customer->>'payment_method' = 'bank_transfer' then 'bank_transfer' else 'cod' end;
begin
  if length(v_name) < 2 then raise exception 'Please enter your full name'; end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 10 then raise exception 'Please enter a valid phone number'; end if;
  if length(v_address) < 5 then raise exception 'Please enter your complete address'; end if;
  if length(v_city) < 2 then raise exception 'Please enter your city'; end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Your cart is empty';
  end if;
  if jsonb_array_length(items) > 50 then raise exception 'Too many items'; end if;

  loop
    select 'HC-' || string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (floor(random() * 31) + 1)::int, 1), '')
      into v_number from generate_series(1, 6);
    exit when not exists (select 1 from orders where order_number = v_number);
  end loop;

  insert into orders (order_number, customer_name, phone, email, address, city, notes,
                      payment_method, postal_code, subtotal, shipping_fee, total)
  values (v_number, v_name, v_phone, nullif(trim(customer->>'email'), ''), v_address, v_city,
          nullif(trim(customer->>'notes'), ''), v_payment,
          nullif(left(regexp_replace(coalesce(customer->>'postal_code', ''), '\D', '', 'g'), 5), ''), 0, 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty < 1 or v_qty > 20 then raise exception 'Invalid quantity'; end if;

    select * into v_product from products
    where id = (v_item->>'product_id')::uuid and is_active
    for update;
    if not found then raise exception 'A product in your cart is no longer available'; end if;

    if coalesce(array_length(v_product.components, 1), 0) > 0 then
      -- Combo product: take stock from each component
      foreach v_cid in array v_product.components loop
        select * into v_comp from products where id = v_cid for update;
        if not found or v_comp.stock < v_qty then
          raise exception 'Only % left in stock for "%"', coalesce(v_comp.stock, 0), v_product.name;
        end if;
        update products set stock = stock - v_qty where id = v_cid;
      end loop;
      update products set stock = (select coalesce(min(p.stock), 0) from products p where p.id = any(v_product.components))
      where id = v_product.id;
    else
      if v_product.stock < v_qty then
        raise exception 'Only % left in stock for "%"', v_product.stock, v_product.name;
      end if;
      update products set stock = stock - v_qty where id = v_product.id;
      v_qmap := jsonb_set(v_qmap, array[v_product.id::text], to_jsonb(coalesce((v_qmap->>v_product.id::text)::int, 0) + v_qty));
      v_bmap := jsonb_set(v_bmap, array[v_product.id::text], to_jsonb(coalesce(v_product.bundle_save, 0)));
    end if;

    insert into order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.images[1], v_product.price, v_qty, v_product.price * v_qty);

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_units := v_units + v_qty;
  end loop;

  -- Combo pricing when all components were bought separately in the same order
  for v_c in
    select c.price, c.components,
           (select sum(p.price) from products p where p.id = any(c.components)) as parts
    from products c
    where c.is_active and coalesce(array_length(c.components, 1), 0) > 0
  loop
    select min(coalesce((v_qmap->>x::text)::int, 0)) into v_n from unnest(v_c.components) x;
    if coalesce(v_n, 0) > 0 and v_c.parts > v_c.price then
      v_combo := v_combo + v_n * (v_c.parts - v_c.price);
      foreach v_cid in array v_c.components loop
        v_qmap := jsonb_set(v_qmap, array[v_cid::text], to_jsonb((v_qmap->>v_cid::text)::int - v_n));
      end loop;
    end if;
  end loop;

  -- Buy 2 of the same product, save (on units not already used in a combo)
  select coalesce(sum(floor((value::text)::int / 2) * coalesce((v_bmap->>key)::numeric, 0)), 0)
    into v_bundle from jsonb_each(v_qmap);

  if v_payment = 'bank_transfer' then
    v_discount := round(v_subtotal * 0.05);   -- 5% off
  end if;
  v_shipping := 0;   -- free delivery on every order

  -- Meta ad offer: extra 3% if ordered before the offer expires (1 min grace), single use, once per phone number
  if coalesce(customer->>'flash_offer', '') ~ '^[0-9a-fA-F-]{36}$' then
    select id into v_offer_id from flash_offers
    where id = (customer->>'flash_offer')::uuid and used_at is null and expires_at + interval '1 minute' > now()
    for update;
    if v_offer_id is not null and not exists (
      select 1 from orders where offer_discount > 0 and status <> 'cancelled' and id <> v_order_id
        and right(regexp_replace(phone, '\D', '', 'g'), 10) = right(regexp_replace(v_phone, '\D', '', 'g'), 10)) then
      v_offer_disc := round(v_subtotal * 0.03);
      update flash_offers set used_at = now(), order_id = v_order_id where id = v_offer_id;
    end if;
  end if;
  v_discount := v_discount + v_offer_disc + v_bundle + v_combo;

  update orders set subtotal = v_subtotal, shipping_fee = v_shipping, discount = v_discount, offer_discount = v_offer_disc,
                    bundle_discount = v_bundle, combo_discount = v_combo,
                    total = v_subtotal - v_discount + v_shipping
  where id = v_order_id;

  return jsonb_build_object('order_number', v_number, 'total', v_subtotal - v_discount + v_shipping,
                            'payment_method', v_payment, 'offer_discount', v_offer_disc,
                            'bundle_discount', v_bundle, 'combo_discount', v_combo);
end $function$;
