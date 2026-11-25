-- Website-only confirmation-call labels (applied 2026-11-24). Never sent to PostEx.
alter table public.orders
  add column if not exists call_status text,
  add column if not exists call_attempts integer not null default 0,
  add column if not exists call_status_at timestamptz;
alter table public.orders drop constraint if exists orders_call_status_check;
alter table public.orders add constraint orders_call_status_check check (call_status is null or call_status in ('no_answer','whatsapp_sent','address_pending'));
create index if not exists orders_call_status_idx on public.orders(call_status) where call_status is not null;
