-- 2026-11-25: product-page reviews without an order (name, stars, comment, optional photo); always 'pending' until an admin approves.
-- reviews.photo_url; storage bucket 'review-photos' (public read, images ≤6 MB, anyone may upload into pending/);
-- public.submit_open_review(p_product_id, p_name, p_rating, p_comment, p_photo_url) — verified = false.
-- public.submit_review(...) also accepts an empty order number: it then finds the buyer's order of that product by phone.
-- orders.source ('website' | 'whatsapp' | 'abandoned') for the Orders page filters (backfilled from notes / order_events).

-- 2026-11-25: checkout_leads_skip_if_ordered (BEFORE INSERT OR UPDATE on checkout_leads): a lead saved while/just after the
-- same phone placed an order (within 24 h, not cancelled) is stored as 'converted' instead of showing as abandoned.
