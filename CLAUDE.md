# Homiqo — notes for Claude

Pakistani cash-on-delivery store **homiqoofficial.site** (Electric Coffee Beater, Portable Mesh Nebulizer, food choppers) + admin panel at `/admin` (installable phone app "Homiqo Admin").

## Working rules (from the owner)
- After every change: build/type-check, **commit and push to `main`** (Vercel auto-deploys from GitHub `Huzilabs/homiqo`). No need to ask first.
- Owner writes short, informal messages, often with screenshots. WhatsApp order screenshots = "create this order" (usually mark **Confirmed**; then they book PostEx themselves).
- Customer-facing WhatsApp text is Roman Urdu; admin UI is English.
- Ask before spending money or changing ad budgets / pausing ads; reading data is fine.

## Stack
- Next.js 15 App Router + Tailwind, TypeScript (`npx tsc --noEmit -p .`). Store pages in `app/(store)`, admin in `app/admin/(panel)`, admin components in `components/admin`.
- **Supabase** project `pzekxtnuucfufhntstrp` (use the Supabase MCP `execute_sql`). Business logic lives in SQL functions: `place_order`, `admin_update_order`, `admin_delete_order`, `postex_*` (book/cancel/sync), `submit_review`, `submit_open_review`, `start_flash_offer`, `save_checkout_lead`. SQL change notes are kept in `supabase/*.sql` (record every DB change there).
- Secrets are in Supabase Vault (e.g. `meta_ads_token`, PostEx) and Vercel env — never commit them.
- **PostEx** courier: confirming an order books it automatically; sync every 15 min.
- Push notifications: `orders_push_notify` trigger → edge function `order-push` → Web Push; service worker `public/admin-sw.js`.

## Orders
- `orders.status`: pending → confirmed (booked on PostEx) → shipped → delivered / cancelled.
- `orders.source`: website | whatsapp | abandoned. `offer_discount > 0` = Meta-offer customer.
- `orders.call_status` (website-only): no_answer, whatsapp_sent, address_pending.
- Creating an order by SQL: `select place_order(customer jsonb, items jsonb)`, then in a **separate** statement set `status='confirmed'`, `source='whatsapp'` and insert an `order_events` note. Check the phone for an existing order first (duplicates happened). Match the city to `postex_cities`.
- Delivery-guide WhatsApp message: `lib/delivery-guide.ts` (popup after a single confirm, not bulk).

## Marketing
- Meta ad account **1469400392041921** (PKR). Meta Ads connector (mcp.facebook.com/ads) may be connected; otherwise read Graph API via SQL `http_get` with the vault token.
- Live campaigns: "Coffee Beater & Milk Frother | Sales | 3 Ad Sets | Rs 800 each" and "Nebulizer | Sales | 3 Ad Sets | 13 Nov" (only Ad Set 3 Broad active).
- Meta-ad visitors get a popup after 10 s: extra **5%** off if they order within 2 min (`FLASH_OFFER` in `lib/config.ts`, DB `place_order` uses 0.05). Test link: `/product/<slug>?offer=test`.
- Buy now = order form sheet on the product page (won the A/B test; `lib/ab.ts`).
- Site analytics: `analytics_events` table (pageview, view_item, begin_checkout, purchase, engaged_10s, scroll_50, video_play, checkout_error).

## Local testing
- A mock Supabase + `next start -p 3100` setup was used for screenshots (Playwright, Chromium preinstalled). Don't commit screenshots.
