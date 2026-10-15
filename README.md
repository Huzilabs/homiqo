# Homiqo — Kitchen & Home E-commerce Store

A complete e-commerce website built with **Next.js 15**, **Supabase** (database, auth and file storage) and **Tailwind CSS**, with **Google Analytics 4** and **Microsoft Clarity** tracking.

## Features

**Storefront**
- Home page with hero, best sellers, product demo videos and category chips
- Shop page with search, category filter and sorting
- Product pages with a photo + video gallery (uploaded MP4/WebM or YouTube), features, discount badges, stock status and related products
- Cart drawer and cart page (saved in the browser), with a free-delivery progress bar
- Cash-on-Delivery checkout. Orders are created in Supabase by a secure database function that recalculates prices, checks stock and reduces inventory, so customers cannot change prices from the browser.
- Order confirmation page with full order summary
- **Order emails over SMTP**: "order received" on checkout, plus "confirmed", "shipped" (with courier & tracking number), "delivered" and "cancelled" when the admin changes status; new-order alert to the store owner
- Product videos auto-play (muted) on hover in product cards, the video reels and the product gallery
- Floating WhatsApp button, contact page, shipping & returns page, SEO metadata, sitemap and product structured data
- Fully responsive, with a sticky “Buy now” bar on mobile

**Admin panel** (`/admin`)
- Secure login (Supabase Auth). Only users in the `admins` table get access.
- Dashboard: 30-day orders and sales, 14-day sales chart, orders awaiting confirmation, low-stock alerts
- Products: create, edit, hide or delete products; **upload photos and videos** to Supabase Storage, or paste image and YouTube links; reorder photos; set price, compare-at price, stock, category and featured flag
- Orders: filter by status, search, pagination; order detail with call/WhatsApp buttons, printing, status updates (pending → confirmed → shipped → delivered / cancelled), courier and tracking number. Cancelling an order returns its stock to inventory automatically.

**Analytics**
- GA4 and Clarity load from environment variables (storefront only; admin traffic is not tracked)
- Meta (Facebook) Pixel: PageView on every page, plus ViewContent, AddToCart, InitiateCheckout, Purchase (order number as event ID) and Search
- GA4 e-commerce events: `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase` (with order number as `transaction_id`), `search`

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql` and click **Run**. This creates the tables, security rules, order functions, the `product-media` storage bucket and the 7 starter products.
3. Go to **Authentication → Users → Add user** and create your admin email and password (tick “Auto confirm”).
4. Back in the SQL editor, make that user an admin:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```
5. Copy your **Project URL** and **anon public key** from **Project Settings → API**.

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill it in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_GA_ID` | Google Analytics → Admin → Data streams → Web → Measurement ID (`G-…`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Events Manager → Data sources → your Pixel → Pixel ID |
| `NEXT_PUBLIC_CLARITY_ID` | clarity.microsoft.com → your project → Settings → Overview → Project ID |
| `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_SITE_URL`, contact details, `NEXT_PUBLIC_WHATSAPP` | Your store details |

### Order emails (SMTP)
Add these environment variables (in `.env.local` and in Vercel → Settings → Environment Variables):

| Variable | Example |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` (Hostinger email) or `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `orders@homiqo.site` |
| `SMTP_PASS` | mailbox password (Gmail: an App Password) |
| `SMTP_FROM` | `Homiqo <orders@homiqo.site>` |
| `ADMIN_NOTIFY_EMAIL` | your inbox for new-order alerts |

If SMTP is not configured the store still works; emails are simply skipped.

### Visitor analytics (built in)
`/admin/analytics` shows visitors, sessions, page views, bounce rate, conversion and add-to-cart rates, live visitors (last 5 minutes), traffic sources (UTM / referrer), devices, countries, top pages, top products and a shopping funnel. Visits are recorded by the store itself (`/api/track` → `analytics_events` table); admin pages and bots are excluded. Nothing to configure.

### Marketing dashboard (Meta Ads)
`/admin/marketing` shows ad spend, cost per purchase, ROAS (Meta-attributed and blended against real store orders), cost per order, CTR, CPC, CPM, reach, an ad funnel, a revenue-vs-spend chart and per-campaign results.

| Variable | Where to get it |
|---|---|
| `META_AD_ACCOUNT_ID` | Ads Manager → account dropdown → the number after `act_` |
| `META_ACCESS_TOKEN` | Business Settings → Users → System users → Generate token (permission `ads_read`, expiry *Never*) |

These are server-only (no `NEXT_PUBLIC_` prefix) so the token never reaches the browser.

### 3. Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000 for the store and http://localhost:3000/admin for the admin panel.

### 4. Deploy (Vercel recommended)
1. Push this folder to a GitHub repository.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the same environment variables in **Project → Settings → Environment Variables**, then deploy.
4. In Supabase → **Authentication → URL Configuration**, set **Site URL** to your live domain.

## After setup
- Go to **/admin/products**, open each product and **upload real photos and demo videos**. Until you do, products show a styled icon placeholder.
- Video uploads are limited to 50 MB per file on Supabase’s free plan. For longer videos, upload to YouTube and paste the link.
- Shipping is Rs 250, free for orders of Rs 5,000 or more. To change it, edit both `lib/config.ts` and the `place_order` function in `supabase/schema.sql` (then re-run that function in the SQL editor).

## Project structure
```
app/(store)/        storefront pages (home, shop, product, cart, checkout, order, track, contact, policies)
app/admin/          admin login + protected panel (dashboard, products, orders)
components/         UI components (admin/ for admin-only)
lib/                config, types, cart state, analytics, Supabase clients, data helpers
supabase/schema.sql database schema, security policies, functions, storage bucket, seed products
middleware.ts       refreshes the Supabase session and protects /admin
```
