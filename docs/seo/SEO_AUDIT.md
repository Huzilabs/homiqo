# Homiqo — SEO & Conversion Audit

**Site:** https://www.homiqoofficial.site · **Audit date:** 3 Nov 2026 · **Stack:** Next.js 15 (App Router) on Vercel, Supabase

## How this audit was done
- **Live crawl** of every sitemap URL plus every internal link found on them (home, shop, 5 categories, 9 products, contact, policies, cart, a missing product URL, a random missing URL, `homiqo.vercel.app`, `http://` apex, and a trailing-slash URL). For each page the crawl recorded the HTTP status, `<title>`, meta description, canonical, robots meta, H1 count and text, `<img>` count and images without alt text.
- **Code review** of every storefront page, the structured data, sitemap, robots, analytics events and checkout.
- **Google autocomplete for Pakistan** (`gl=pk`) was used for search-intent research (see `SEO_KEYWORD_MAP.md`).
- **Not available:** Google PageSpeed Insights hit its shared daily quota during the audit, and there is no access to Google Search Console data. Core Web Vitals and ranking positions are therefore **not** reported here; see `SEO_TECHNICAL_CHECKLIST.md` for how to measure them.

## Findings before fixes (prioritised)

| # | Priority | Issue | Evidence | Status |
|---|---|---|---|---|
| 1 | **High** | Category pages were query-string URLs (`/shop?category=Kitchen%20Tools`) with a generic title and description and no unique content, so they could not rank on their own | Crawl: title "Kitchen Tools — Buy Online in Pakistan", H1 just "Kitchen Tools" | ✅ Fixed: `/category/<slug>` pages with their own title, description, H1, intro, buying guide, breadcrumbs and schema; old URLs 301 to them |
| 2 | **High** | Product names didn't match how Pakistanis search (e.g. people search **"coffee beater"**, not "milk frother"; **"mandoline slicer"**, **"sink rack"**, **"nebulizer machine"**) | Google autocomplete (PK) | ✅ Fixed: names updated; URLs unchanged |
| 3 | **High** | `homiqo.vercel.app` served a full duplicate of the site (200 OK) | Crawl | ✅ Fixed: permanent redirect to `www.homiqoofficial.site` (canonical tags were already pointing correctly) |
| 4 | **High** | Checkout required an email address, which many Pakistani COD customers don't use | `app/api/checkout/route.ts` | ✅ Fixed: email optional |
| 5 | **High** | No WhatsApp support link anywhere (number not configured) | `STORE.whatsapp` empty | ✅ Fixed: +92 305 4471454 shown site-wide (floating button, product page, checkout, contact, FAQ) |
| 6 | Medium | Home H1 "Clever tools for the heart of your home" carried no search terms; hero copy mentioned products no longer sold ("qeema makers", "coffee makers") | Crawl + code | ✅ Fixed: "Clever kitchen gadgets for the heart of your home" + accurate copy |
| 7 | Medium | Home title 77 chars and description 220 chars (truncated in Google) | Crawl | ✅ Fixed: 55 / 158 chars |
| 8 | Medium | Product meta descriptions up to 254 chars and included the "was" price | Crawl | ✅ Fixed: generated, unique, ≤158 chars, no strike-through price |
| 9 | Medium | Cart page indexable, used the generic home title, no H1 in server HTML | Crawl | ✅ Fixed: `noindex`, title "Your cart" (it was already disallowed in robots.txt) |
| 10 | Medium | Product gallery thumbnails and two home images had empty alt text; every gallery image had the identical alt | Crawl: 4–6 images per product page without alt | ✅ Fixed: "Name — photo 2 of 5", "Name thumbnail 3"; decorative banner marked `role="presentation"` |
| 11 | Medium | Uploaded product photos had random filenames (`fc26a47c-…png`) | Database | ✅ Fixed: copied to descriptive names (`catalog/rechargeable-…`); originals kept |
| 12 | Medium | No Google Merchant Center feed | — | ✅ Added `/feed.xml` |
| 13 | Medium | GA4 missing `view_item_list` and `add_payment_info`; purchase sent `payment_type: "cod"` even for bank transfers | `lib/analytics.ts` | ✅ Fixed |
| 14 | Low | 404 page used the home title | Crawl | ✅ Fixed: "Page not found", noindex, links to shop |
| 15 | Low | Product breadcrumb and "View all" linked to `/shop` instead of the category | Code | ✅ Fixed: breadcrumb → category page; related products prefer the same category |
| 16 | Low | Images served as the uploaded PNG/JPG sizes only via WebP | `next.config.mjs` | ✅ AVIF first, WebP fallback, 30-day image cache |
| 17 | Low | Home FAQ promised "usually replies within the hour" (unverifiable) | Code | ✅ Reworded |

## Things that were already correct (verified)
- One H1 on every page; correct 200/404 status codes (a deleted product returns 404 with `noindex`).
- HTTPS everywhere; `homiqoofficial.site` → `www` redirect; trailing slash `/shop/` → `/shop`.
- Product pages: unique titles in the "Price in Pakistan" format, canonical tags, `Product` + `Offer` (PKR, availability, shipping, 7-day return policy), `BreadcrumbList`, `FAQPage`, `Organization`/`OnlineStore`, `WebSite` + `SearchAction` structured data.
- Sitemap (submitted, "Success · 20 pages" in Search Console) with product image entries; robots.txt blocks admin, API, cart, checkout, order pages, internal search and sorted listings.
- Pages are statically generated and edge-cached (≈0.2 s server response measured after the speed work).
- No pagination (the catalogue is small), so no pagination handling is needed yet.
- No broken internal links found in the crawl.

## Remaining gaps (need data or decisions from the business)
| Gap | Why it matters | What's needed |
|---|---|---|
| Product specifications (dimensions, capacity, wattage, battery, materials, what's in the box) | Specs are a major buying and ranking factor; we must not invent them | Real specs from the supplier/packaging for each product |
| Customer reviews | Star ratings improve click-through and trust | Genuine reviews only (a review feature can be built) |
| Contact email / business address on the site | Trust + consistent business info | A public support email; a business address only if you want it shown |
| Product videos for most products | Video improves conversion | Your own product videos (old stock videos were removed or are low quality) |
| Core Web Vitals measurement | Ranking + UX | Run PageSpeed Insights manually (steps in the checklist) |
| Main product images are 1.6–2.6 MB PNGs | Visitors get optimised AVIF/WebP automatically, but the originals are used in the Merchant feed and social shares | Optional: export as JPG/WebP ≈200–400 KB before uploading |
