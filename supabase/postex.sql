-- =====================================================================
--  PostEx courier integration (two-way)
--  Requires: extensions http + pg_cron, and the API token stored in Vault:
--    select vault.create_secret('<POSTEX_TOKEN>', 'postex_api_token', 'PostEx merchant API token');
-- =====================================================================

alter table public.orders add column if not exists postex_status text;
alter table public.orders add column if not exists postex_synced_at timestamptz;
alter table public.orders add column if not exists postex_history jsonb;
alter table public.orders add column if not exists postex_error text;
alter table public.orders add column if not exists postex_city text;

create table if not exists public.postex_cities (
  name text primary key,
  is_delivery boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.postex_cities enable row level security;
drop policy if exists "public reads postex cities" on public.postex_cities;
create policy "public reads postex cities" on public.postex_cities for select using (true);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Low-level call to the PostEx API with the vault-stored token
create or replace function private.postex_call(p_method text, p_path text, p_body jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r   extensions.http_response;
  tok text;
begin
  select decrypted_secret into tok from vault.decrypted_secrets where name = 'postex_api_token';
  if tok is null then raise exception 'PostEx API token is not configured'; end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '25');
  r := extensions.http((
    p_method,
    'https://api.postex.pk/services/integration/api/order/' || p_path,
    array[extensions.http_header('token', tok)],
    case when p_body is null then null else 'application/json' end,
    case when p_body is null then null else p_body::text end
  )::extensions.http_request);
  return jsonb_build_object(
    'status', r.status,
    'body', case when r.content ~ '^\s*[\{\[]' then r.content::jsonb else to_jsonb(r.content) end
  );
end $$;

-- 03xxxxxxxxx format required by PostEx
create or replace function private.postex_phone(p text)
returns text language sql immutable as $$
  select case
    when d ~ '^92\d{10}$' then '0' || substr(d, 3)
    when d ~ '^3\d{9}$'   then '0' || d
    else d end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') d) x
$$;

create or replace function public.postex_match_city(p_city text)
returns text language sql stable security definer set search_path = public as $$
  select name from postex_cities
  where is_delivery and upper(name) = upper(trim(p_city))
  limit 1
$$;

create or replace function public.postex_refresh_cities()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare res jsonb; n integer;
begin
  if not (public.is_admin() or session_user in ('postgres', 'supabase_admin')) then raise exception 'not allowed'; end if;
  res := private.postex_call('GET', 'v2/get-operational-city');
  if (res->>'status')::int <> 200 then raise exception 'PostEx cities error: %', res->'body'; end if;
  insert into postex_cities (name, is_delivery, updated_at)
  select c->>'operationalCityName', coalesce((c->>'isDeliveryCity')::boolean, true), now()
  from jsonb_array_elements(res->'body'->'dist') c
  where coalesce(c->>'operationalCityName', '') <> ''
  on conflict (name) do update set is_delivery = excluded.is_delivery, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $$;

-- Exactly what will be sent to PostEx for an order (used for preview and booking)
create or replace function public.postex_order_payload(p_order_id uuid, p_city text default null, p_pickup_code text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare o orders%rowtype; v_city text; v_detail text; v_items int;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into o from orders where id = p_order_id;
  if not found then raise exception 'Order not found'; end if;
  v_city := coalesce(nullif(trim(p_city), ''), o.postex_city, public.postex_match_city(o.city));
  select string_agg(product_name || ' x' || quantity, ', ' order by product_name), coalesce(sum(quantity), 0)
    into v_detail, v_items from order_items where order_id = o.id;
  return jsonb_strip_nulls(jsonb_build_object(
    'orderRefNumber', o.order_number,
    -- bank transfers are prepaid: nothing to collect on delivery
    'invoicePayment', case when o.payment_method = 'bank_transfer' then 0 else o.total end,
    'orderDetail', left(coalesce(v_detail, ''), 250),
    'customerName', o.customer_name,
    'customerPhone', private.postex_phone(o.phone),
    'deliveryAddress', o.address || coalesce(', Postal code ' || o.postal_code, ''),
    'transactionNotes', nullif(left(coalesce(o.notes, ''), 250), ''),
    'cityName', v_city,
    'invoiceDivision', 1,
    'items', greatest(v_items, 1),
    'orderType', 'Normal',
    'pickupAddressCode', coalesce(nullif(trim(coalesce(p_pickup_code, '')), ''), '001')  -- PostEx default pickup address (Kasur)
  ));
end $$;

-- Admin approves the order (after calling the customer) → booked on PostEx, order confirmed
create or replace function public.postex_book_order(p_order_id uuid, p_city text default null, p_pickup_code text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare o orders%rowtype; payload jsonb; res jsonb; tracking text; msg text;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.status = 'cancelled' then return jsonb_build_object('ok', false, 'error', 'This order is cancelled.'); end if;
  if o.courier = 'PostEx' and o.tracking_number is not null then
    return jsonb_build_object('ok', false, 'error', 'Already booked on PostEx (' || o.tracking_number || ').');
  end if;

  payload := public.postex_order_payload(p_order_id, p_city, p_pickup_code);
  if payload->>'cityName' is null or public.postex_match_city(payload->>'cityName') is null then
    return jsonb_build_object('ok', false, 'needs_city', true,
      'error', 'City "' || coalesce(p_city, o.city) || '" is not on PostEx''s delivery list. Pick the matching PostEx city.');
  end if;

  res := private.postex_call('POST', 'v3/create-order', payload);
  tracking := res->'body'->'dist'->>'trackingNumber';

  if (res->>'status')::int = 200 and tracking is not null then
    update orders set
      status = case when status = 'pending' then 'confirmed' else status end,
      courier = 'PostEx',
      tracking_number = tracking,
      postex_status = coalesce(res->'body'->'dist'->>'orderStatus', 'Unbooked'),
      postex_city = payload->>'cityName',
      postex_error = null,
      postex_synced_at = now()
    where id = p_order_id;
    if o.status = 'pending' then
      -- the status trigger just logged "confirmed"; annotate it instead of adding a duplicate
      update order_events set note = 'Booked on PostEx · ' || tracking
      where id = (select max(id) from order_events where order_id = p_order_id and status = 'confirmed');
    else
      insert into order_events (order_id, status, note) values (p_order_id, o.status, 'Booked on PostEx · ' || tracking);
    end if;
    return jsonb_build_object('ok', true, 'tracking_number', tracking, 'postex_status', res->'body'->'dist'->>'orderStatus');
  end if;

  msg := coalesce(res->'body'->>'statusMessage', res->'body'->>'message', res->'body'->>'error', left(res->>'body', 300));
  update orders set postex_error = msg where id = p_order_id;
  return jsonb_build_object('ok', false, 'error', 'PostEx: ' || msg, 'http_status', res->>'status');
end $$;

-- Cancel the shipment on PostEx (website → PostEx)
create or replace function public.postex_cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare o orders%rowtype; res jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into o from orders where id = p_order_id;
  if not found then raise exception 'Order not found'; end if;
  if o.courier is distinct from 'PostEx' or o.tracking_number is null then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;
  res := private.postex_call('PUT', 'v1/cancel-order', jsonb_build_object('trackingNumber', o.tracking_number));
  if (res->>'status')::int = 200 and coalesce(res->'body'->>'statusCode', '200') = '200' then
    update orders set postex_status = 'Cancelled', postex_error = null, postex_synced_at = now() where id = p_order_id;
    return jsonb_build_object('ok', true);
  end if;
  update orders set postex_error = coalesce(res->'body'->>'statusMessage', left(res->>'body', 300)) where id = p_order_id;
  return jsonb_build_object('ok', false, 'error', 'PostEx: ' || coalesce(res->'body'->>'statusMessage', res->>'body'));
end $$;

-- PostEx status → store status (only ever moves forward)
create or replace function private.postex_map_status(p text)
returns text language sql immutable as $$
  select case
    when s = 'delivered' then 'delivered'
    when s like 'return%' or s like 'cancel%' then 'cancelled'
    when s in ('picked by postex', 'en-route to postex warehouse', 'postex warehouse', 'out for delivery',
               'attempted', 'delivery under review', 'out for return') then 'shipped'
    else null end
  from (select lower(trim(coalesce(p, ''))) s) x
$$;

-- PostEx → website: pull latest status for every active PostEx shipment
create or replace function public.postex_sync()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  batch text[];
  res jsonb;
  item jsonb;
  tr jsonb;
  o orders%rowtype;
  new_status text;
  rank_old int; rank_new int;
  checked int := 0; updated int := 0;
  changes jsonb := '[]';
  errors jsonb := '[]';
begin
  if not (public.is_admin() or session_user in ('postgres', 'supabase_admin')) then raise exception 'not allowed'; end if;

  for batch in
    select array_agg(tracking_number) from (
      select tracking_number, (row_number() over (order by created_at) - 1) / 50 grp
      from orders
      where courier = 'PostEx' and tracking_number is not null
        and (status not in ('delivered', 'cancelled') or postex_status is null or created_at > now() - interval '3 days')
        and created_at > now() - interval '60 days'
    ) t group by grp
  loop
    res := private.postex_call('GET', 'v1/track-bulk-order?trackingNumber=' || array_to_string(batch, ','));
    if (res->>'status')::int <> 200 then
      errors := errors || jsonb_build_object('http', res->>'status', 'body', left(res->>'body', 200));
      continue;
    end if;
    for item in select * from jsonb_array_elements(coalesce(res->'body'->'dist', '[]')) loop
      tr := item->'trackingResponse';
      if tr is null then continue; end if;
      select * into o from orders where tracking_number = coalesce(item->>'trackingNumber', tr->>'trackingNumber') and courier = 'PostEx';
      if not found then continue; end if;
      checked := checked + 1;
      new_status := private.postex_map_status(tr->>'transactionStatus');
      rank_old := array_position(array['pending','confirmed','shipped','delivered','cancelled'], o.status);
      rank_new := array_position(array['pending','confirmed','shipped','delivered','cancelled'], new_status);
      if new_status is null or rank_new <= rank_old or o.status in ('delivered', 'cancelled') then new_status := o.status; end if;

      update orders set
        postex_status = tr->>'transactionStatus',
        postex_history = tr,
        postex_synced_at = now(),
        postex_error = null,
        status = new_status
      where id = o.id;

      if new_status <> o.status then
        updated := updated + 1;
        changes := changes || jsonb_build_object('order_id', o.id, 'order_number', o.order_number, 'from', o.status, 'to', new_status, 'postex', tr->>'transactionStatus');
      end if;
    end loop;
  end loop;

  return jsonb_build_object('checked', checked, 'updated', updated, 'changes', changes, 'errors', errors);
end $$;

-- Airway bill PDF (base64) for printing
create or replace function public.postex_airway_bill(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare o orders%rowtype; tok text; r extensions.http_response;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into o from orders where id = p_order_id;
  if not found or o.courier is distinct from 'PostEx' or o.tracking_number is null then raise exception 'Order is not booked on PostEx'; end if;
  select decrypted_secret into tok from vault.decrypted_secrets where name = 'postex_api_token';
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '25');
  r := extensions.http(('GET',
    'https://api.postex.pk/services/integration/api/order/v1/get-invoice?trackingNumbers=' || o.tracking_number,
    array[extensions.http_header('token', tok)], null, null)::extensions.http_request);
  if r.status <> 200 then raise exception 'PostEx airway bill error % : %', r.status, left(r.content, 200); end if;
  return encode(textsend(r.content), 'base64');
end $$;
revoke all on function public.postex_airway_bill(uuid) from public, anon;
grant execute on function public.postex_airway_bill(uuid) to authenticated;

revoke all on function private.postex_call(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.postex_refresh_cities() from public, anon;
revoke all on function public.postex_order_payload(uuid, text, text) from public, anon;
revoke all on function public.postex_book_order(uuid, text, text) from public, anon;
revoke all on function public.postex_cancel_order(uuid) from public, anon;
revoke all on function public.postex_sync() from public, anon;
grant execute on function public.postex_match_city(text) to anon, authenticated;
grant execute on function public.postex_refresh_cities(), public.postex_order_payload(uuid, text, text),
  public.postex_book_order(uuid, text, text), public.postex_cancel_order(uuid), public.postex_sync() to authenticated;

-- Schedules: status sync every 15 minutes, city list daily
select cron.unschedule(jobid) from cron.job where jobname in ('postex-sync', 'postex-cities');
select cron.schedule('postex-sync', '*/15 * * * *', $c$select public.postex_sync()$c$);
select cron.schedule('postex-cities', '17 3 * * *', $c$select public.postex_refresh_cities()$c$);
