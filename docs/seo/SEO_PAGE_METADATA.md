# Homiqo — Page Metadata

Base URL: `https://www.homiqoofficial.site`. Titles get the ` | Homiqo` suffix from the layout template unless shown in full. Product titles and descriptions are **generated from the product's name, price and short description** (`lib/seo.ts`), so they stay unique and correct when you edit a product in admin. Category copy lives in `lib/categories.ts`.

All indexable pages use self-referencing canonicals, `index, follow`, Open Graph tags and `summary_large_image` Twitter cards.

## Core pages

| URL | Type | Primary keyword | Search intent | SEO title | Meta description | H1 | Structured data | Indexable |
|---|---|---|---|---|---|---|---|---|
| `/` | Home | kitchen gadgets in Pakistan | Commercial / brand | Homiqo — Kitchen Gadgets & Home Essentials in Pakistan | Shop kitchen gadgets online in Pakistan — vegetable choppers, electric choppers, coffee beaters, sink organizers & handheld vacuums. Cash on delivery nationwide. | Clever kitchen gadgets for the heart of your home | OnlineStore (Organization), WebSite + SearchAction, ItemList, FAQPage | ✅ |
| `/shop` | All products | kitchen gadgets online | Commercial | Shop Kitchen Gadgets & Home Essentials Online in Pakistan \| Homiqo | Browse all Homiqo products — vegetable choppers, electric choppers, coffee beaters, sink organizers, handheld vacuums and more. Cash on delivery across Pakistan. | Kitchen gadgets & home essentials | ItemList | ✅ (`?q=` and `?sort=` variants are noindex) |
| `/policies` | Policy | Homiqo delivery & returns | Informational | Shipping & returns \| Homiqo | Homiqo delivery and returns policy: cash on delivery across Pakistan, 2–5 working day delivery, free delivery over Rs 5,000 and 7-day replacements. | Shipping & returns | — | ✅ |
| `/contact` | Contact | Homiqo contact | Navigational | Contact us \| Homiqo | Get in touch with Homiqo — questions about products, orders, delivery or returns. We reply quickly on WhatsApp and email. | Contact us | — | ✅ |
| `/cart` | Cart | — | — | Your cart \| Homiqo | — | Shopping cart | — | ❌ noindex + robots.txt |
| `/checkout` | Checkout | — | — | Checkout \| Homiqo | — | Checkout | — | ❌ noindex + robots.txt |
| `/order/*` | Order confirmation | — | — | Order confirmed \| Homiqo | — | Thank you! | — | ❌ noindex + robots.txt |
| any missing URL | 404 | — | — | Page not found \| Homiqo | — | Page not found | — | ❌ 404 + noindex |

## Category pages (`/category/<slug>`)

| URL | Primary keyword | SEO title (+ " \| Homiqo") | Meta description | H1 | Structured data |
|---|---|---|---|---|---|
| `/category/kitchen-appliances` | electric chopper | Kitchen Appliances in Pakistan — Electric Choppers & Coffee Beaters | Shop compact kitchen appliances in Pakistan: rechargeable electric choppers and coffee beaters / milk frothers. Cash on delivery nationwide. | Small kitchen appliances | CollectionPage + ItemList, BreadcrumbList |
| `/category/kitchen-tools` | vegetable chopper / cutter | Kitchen Tools in Pakistan — Vegetable Choppers, Slicers & Knife Sharpeners | Buy vegetable choppers, mandoline slicers and knife sharpeners online in Pakistan. Faster, safer food prep. Cash on delivery & 7-day returns. | Kitchen tools for faster prep | CollectionPage + ItemList, BreadcrumbList |
| `/category/kitchen-storage` | kitchen sink organizer | Kitchen Sink Organizers & Sink Racks in Pakistan | Kitchen sink organizers, sink racks and sponge holders that keep your counter dry and tidy. Order online in Pakistan with cash on delivery. | Kitchen sink organizers & racks | CollectionPage + ItemList, BreadcrumbList |
| `/category/home-cleaning` | handheld vacuum cleaner | Cordless Handheld Vacuum Cleaners in Pakistan — Car & Home | Cordless handheld vacuum cleaners for car seats, sofas and quick clean-ups. USB rechargeable. Buy online in Pakistan with cash on delivery. | Home cleaning | CollectionPage + ItemList, BreadcrumbList |
| `/category/health-care` | portable nebulizer | Portable Nebulizer Machines in Pakistan | Portable, rechargeable mesh nebulizer machines for home and travel. Order online in Pakistan with cash on delivery. Use as prescribed by your doctor. | Health & care | CollectionPage + ItemList, BreadcrumbList |

The old URLs `/shop?category=<Name>` permanently redirect to these pages. All category pages are indexable with self-canonicals.

## Product pages (`/product/<slug>`)

All product pages have:
- one H1 (the product name)
- H2s: "About the <name>", "<name> — questions, answered", "More <category>"
- H3s inside the description: Why you'll love it, How to use it, Care, Delivery in Pakistan, and so on
- structured data: **Product + Offer** (PKR price, availability, condition new, cash-on-delivery payment, shipping to PK with a 2–5 day transit time, 7-day return policy, brand Homiqo, SKU = slug), **BreadcrumbList** (Home › Category › Product) and **FAQPage**
- canonical = own URL, and indexable ✅

| URL | Primary keyword | SEO title (full) | Meta description |
|---|---|---|---|
| `/product/electric-food-chopper-qeema-maker` | rechargeable chopper price in Pakistan | Rechargeable Electric Food Chopper Price in Pakistan – Rs 1,899 \| Homiqo | Buy Rechargeable Electric Food Chopper online in Pakistan for Rs 1,899. Cordless, rechargeable mini chopper — chop, mince… Cash on delivery nationwide. |
| `/product/electric-milk-frother-egg-beater` | coffee beater price in Pakistan | Electric Coffee Beater & Milk Frother Price in Pakistan – Rs 1,399 \| Homiqo | Buy Electric Coffee Beater & Milk Frother online in Pakistan for Rs 1,399. Coffee beater and milk frother for café-style… Cash on delivery nationwide. |
| `/product/vegetable-chopper-16-in-1` | vegetable chopper price in Pakistan | 16-in-1 Vegetable Chopper & Slicer Price in Pakistan – Rs 2,099 \| Homiqo | Buy 16-in-1 Vegetable Chopper & Slicer online in Pakistan for Rs 2,099. 16-piece vegetable chopper and cutter — dice, slice… Cash on delivery nationwide. |
| `/product/vegetable-slicer-cutter` | mandoline slicer price in Pakistan | Mandoline Vegetable Slicer & Cutter Price in Pakistan – Rs 1,449 \| Homiqo | Buy Mandoline Vegetable Slicer & Cutter online in Pakistan for Rs 1,449. Adjustable mandoline slicer — slice, julienne and… Cash on delivery nationwide. |
| `/product/knife-sharpener` | knife sharpener price in Pakistan | 3-Stage Knife Sharpener Price in Pakistan – Rs 899 \| Homiqo | Buy 3-Stage Knife Sharpener online in Pakistan for Rs 899. 3-stage knife sharpener — repair, sharpen and polish dull kitchen… Cash on delivery nationwide. |
| `/product/kitchen-sink-organizer` | kitchen sink organizer rack | Kitchen Sink Organizer Rack Price in Pakistan – Rs 949 \| Homiqo | Buy Kitchen Sink Organizer Rack online in Pakistan for Rs 949. Kitchen sink organizer rack for soap, sponges and brushes, with… Cash on delivery nationwide. |
| `/product/faucet-sink-rack` | sink rack price in Pakistan | Faucet Sink Rack & Sponge Holder Price in Pakistan – Rs 1,099 \| Homiqo | Buy Faucet Sink Rack & Sponge Holder online in Pakistan for Rs 1,099. Clamps onto your tap — holds sponge, soap and dishcloth… Cash on delivery nationwide. |
| `/product/cordless-handheld-vacuum-cleaner` | handheld vacuum cleaner price in Pakistan | Cordless Handheld Vacuum Cleaner Price in Pakistan – Rs 1,899 \| Homiqo | Buy Cordless Handheld Vacuum Cleaner online in Pakistan for Rs 1,899. Cordless, USB-rechargeable handheld vacuum for car seats… Cash on delivery nationwide. |
| `/product/portable-mesh-nebulizer` | portable nebulizer price in Pakistan | Portable Mesh Nebulizer Machine Price in Pakistan – Rs 1,499 \| Homiqo | Buy Portable Mesh Nebulizer Machine online in Pakistan for Rs 1,499. Quiet, handheld and USB-rechargeable mesh nebulizer… Cash on delivery nationwide. |

Product URLs were **kept as they are** (some slugs are not ideal, e.g. `electric-food-chopper-qeema-maker`). Changing them would throw away the URLs Google has already discovered from the submitted sitemap, for a very small gain. If a slug is ever changed, add a 301 redirect from the old one.

### Product name changes (made from Pakistan search data; editable in Admin → Products)
| Before | After |
|---|---|
| Electric Milk Frother & Egg Beater | Electric Coffee Beater & Milk Frother |
| Vegetable Slicer Cutter | Mandoline Vegetable Slicer & Cutter |
| Faucet Sink Rack Organizer | Faucet Sink Rack & Sponge Holder |
| Kitchen Sink Organizer | Kitchen Sink Organizer Rack |
| Knife Sharpener | 3-Stage Knife Sharpener |
| Portable Mesh Nebulizer | Portable Mesh Nebulizer Machine |
| Electric Food Chopper (Rechargeable) | Rechargeable Electric Food Chopper |
