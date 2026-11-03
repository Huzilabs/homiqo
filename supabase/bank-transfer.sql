-- Bank transfer payment: 5% off the products (delivery charged as normal). Customer sends the payment
-- screenshot on WhatsApp; admin verifies it before confirming / booking the courier.

alter table public.orders add column if not exists discount numeric(12,2) not null default 0;
alter table public.orders add column if not exists postal_code text;

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
  v_item       jsonb;
  v_qty        integer;
  v_product    products%rowtype;
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
    if v_product.stock < v_qty then
      raise exception 'Only % left in stock for "%"', v_product.stock, v_product.name;
    end if;

    update products set stock = stock - v_qty where id = v_product.id;

    insert into order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.images[1], v_product.price, v_qty, v_product.price * v_qty);

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_units := v_units + v_qty;
  end loop;

  if v_payment = 'bank_transfer' then
    v_discount := round(v_subtotal * 0.05);   -- 5% off
    v_shipping := case when v_subtotal >= 5000 or v_units >= 2 then 0 else 250 end;
  else
    -- free delivery on 2+ items or Rs 5,000+
    v_shipping := case when v_subtotal >= 5000 or v_units >= 2 then 0 else 250 end;
  end if;

  update orders set subtotal = v_subtotal, shipping_fee = v_shipping, discount = v_discount,
                    total = v_subtotal - v_discount + v_shipping
  where id = v_order_id;

  return jsonb_build_object('order_number', v_number, 'total', v_subtotal - v_discount + v_shipping,
                            'payment_method', v_payment);
end $function$;

create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb
language plpgsql
stable security definer
set search_path = public
as $function$
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
    'discount', v_order.discount,
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
end $function$;
