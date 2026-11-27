-- 2026-11-27: order-form add-on at a special price (knife sharpener Rs 550 instead of Rs 999).
alter table products add column if not exists addon_price numeric(12,2);
update products set addon_price = 550 where slug = 'knife-sharpener';

-- place_order(): items may carry "addon": true. Inside the item loop (before the components check):
--   v_addon := coalesce((v_item->>'addon')::boolean, false) and v_product.addon_price is not null
--              and jsonb_array_length(items) > 1 and v_qty = 1;
--   v_price := case when v_addon then v_product.addon_price else v_product.price end;
-- order_items/subtotal use v_price instead of v_product.price, and an add-on line is NOT added to the
-- Buy-2 (v_bmap) / combo (v_qmap) maps, so it never gets a second discount.
-- (new declares: v_price numeric(12,2); v_addon boolean;)
