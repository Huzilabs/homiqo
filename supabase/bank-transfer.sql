-- Bank transfer payment: 5% off the products (delivery charged as normal). Customer sends the payment
-- screenshot on WhatsApp; admin verifies it before confirming / booking the courier.

alter table public.orders add column if not exists discount numeric(12,2) not null default 0;
alter table public.orders add column if not exists postal_code text;
alter table public.orders add column if not exists bundle_discount numeric(12,2) not null default 0;
-- Bundle: Rs off for every 2 units of the same product (e.g. coffee beater: buy 2, save Rs 200)
alter table public.products add column if not exists bundle_save numeric(12,2) not null default 0;

-- place_order() now lives in supabase/combos.sql (bank transfer, Meta offer, buy-2 bundle and combos).

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
