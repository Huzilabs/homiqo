-- Admin analytics: every session that reached checkout, with source, cart value, time on checkout and result.
-- security invoker: only admins can read analytics_events (RLS), so only admins get rows.
create or replace function public.analytics_checkout_sessions(p_from timestamptz, p_to timestamptz)
returns table (session_id text, started_at timestamptz, device text, source text, campaign text,
               cart_value numeric, secs_on_checkout int, ordered boolean, last_path text)
language sql stable security invoker set search_path = public as $$
  with s as (
    select e.session_id,
           min(e.created_at) filter (where e.type = 'begin_checkout') co_at,
           max(e.device) device,
           max(nullif(e.utm_source, '')) src,
           max(nullif(e.utm_campaign, '')) camp,
           max(e.referrer) ref,
           max(e.created_at) last_at,
           bool_or(e.type = 'purchase') ordered
    from analytics_events e
    where e.created_at >= p_from and e.created_at < p_to
    group by e.session_id
    having bool_or(e.type = 'begin_checkout')
  )
  select s.session_id, s.co_at, s.device,
    coalesce(s.src, case when s.ref ilike '%facebook%' or s.ref ilike '%instagram%' then 'facebook'
                         when s.ref ilike '%google%' then 'google' else 'direct' end),
    s.camp,
    (select x.value from analytics_events x where x.session_id = s.session_id and x.type = 'begin_checkout' order by x.created_at desc limit 1),
    extract(epoch from coalesce(
      (select min(y.created_at) from analytics_events y where y.session_id = s.session_id and y.created_at > s.co_at
         and (y.type = 'purchase' or (y.type = 'pageview' and y.path not like '/checkout%'))),
      s.last_at) - s.co_at)::int,
    s.ordered,
    (select x.path from analytics_events x where x.session_id = s.session_id order by x.created_at desc limit 1)
  from s
  order by s.co_at desc
  limit 200
$$;
grant execute on function public.analytics_checkout_sessions(timestamptz, timestamptz) to authenticated;
