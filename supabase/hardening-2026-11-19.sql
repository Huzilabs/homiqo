-- Applied 2026-11-19 (site review)
revoke execute on function public.checkout_leads_mark_converted() from public, anon, authenticated;
revoke execute on function public.sync_combo_stock() from public, anon, authenticated;
alter function private.postex_map_status(text) set search_path = public;
alter function private.postex_phone(text) set search_path = public;
-- private.try_get, private.time_get, public._pexels_videos: search_path = public, extensions

-- Complete Pakistani mobile number check, used by place_order:
create or replace function public.is_pk_mobile(p text) returns boolean language sql immutable set search_path = public as $$
  select regexp_replace(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '^(0092|92|0)', '') ~ '^3[0-9]{9}$'
$$;
-- place_order: `if not public.is_pk_mobile(v_phone) then raise exception 'Please enter a complete mobile number, e.g. 0300 1234567'; end if;`
