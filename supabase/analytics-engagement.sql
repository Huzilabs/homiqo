-- Allow the engagement event types sent by /api/track (applied 2026-11-13)
alter table public.analytics_events drop constraint analytics_events_type_check;
alter table public.analytics_events add constraint analytics_events_type_check check (type = any (array['pageview','view_item','add_to_cart','begin_checkout','purchase','engaged_10s','engaged_30s','scroll_50','video_play','checkout_error']));
alter table public.analytics_events add constraint analytics_events_label_check check (label is null or length(label) <= 200) not valid;
