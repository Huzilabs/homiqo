-- 2026-11-25: product-page reviews without an order (name, stars, comment, optional photo); always 'pending' until an admin approves.
-- reviews.photo_url; storage bucket 'review-photos' (public read, images ≤6 MB, anyone may upload into pending/);
-- public.submit_open_review(p_product_id, p_name, p_rating, p_comment, p_photo_url) — verified = false.
-- public.submit_review(...) also accepts an empty order number: it then finds the buyer's order of that product by phone.
-- orders.source ('website' | 'whatsapp' | 'abandoned') for the Orders page filters (backfilled from notes / order_events).

-- 2026-11-25: checkout_leads_skip_if_ordered (BEFORE INSERT OR UPDATE on checkout_leads): a lead saved while/just after the
-- same phone placed an order (within 24 h, not cancelled) is stored as 'converted' instead of showing as abandoned.

-- 2026-11-26: checkout_leads.notified_at + public.notify_abandoned_leads() (pg_cron 'notify-abandoned-leads', every 5 min):
-- push to admin phones ~15 min after an open lead with a valid phone (edge function order-push, body {lead_id}).
-- orders.review_asked_at: set when the admin sends the review request from Admin → Reviews → "Ask for reviews".

-- 2026-11-26: delivery problems + customer confirmation + risk flags
-- orders: customer_confirmed_at, customer_response (confirmed|cancelled|cancel_requested), postex_attempt_reason/_at, postex_alert_key.
-- postex_attempt_label(msg) → plain reason (RFD refused, CNA not available, ICA incomplete address, RAD restricted, under review).
-- orders_postex_attempt_alert: BEFORE UPDATE OF postex_history — new "Attempt Made"/"Delivery Under Review" → push (order-push {attempt_order_id}).
-- customer_respond_order(number, phone, 'confirm'|'cancel') — anon; pending cancel = cancelled, booked = cancel_requested; push to admin.
-- order_risk_flags(uuid[]) — admin: refused_before, short_address, duplicate.
-- track_order also returns postex_status, postex_attempt_reason, customer_confirmed_at, customer_response.

-- 2026-11-26: nightly summary — daily_summary(day) (orders, ad spend, delivered, returned, problems, profit; Pakistan day),
-- send_daily_summary() (meta_ads_sync(1) then order-push {summary:true}); pg_cron 'daily-summary' 0 17 * * * (22:00 PKT).
