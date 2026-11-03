import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, STORE } from "./config";
import type { Product } from "./types";

export const SITE = STORE.siteUrl.replace(/\/$/, "");

/** Absolute URL for a path or an already-absolute URL. */
export const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/"}${u}`);

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`;

/** "Electric Milk Frother – Price in Pakistan Rs 1,399" style title (how Pakistani shoppers search). */
export const productTitle = (p: Product) => `${p.name} Price in Pakistan – ${rs(p.price)}`;

/** Unique meta description per product, kept within ~158 characters so Google shows it whole. */
export const productDescription = (p: Product) => {
  const head = `Buy ${p.name} online in Pakistan for ${rs(p.price)}.`;
  const tail = " Cash on delivery nationwide.";
  let mid = ` ${p.short_description.trim().replace(/\.?$/, ".")}`;
  const room = 158 - head.length - tail.length;
  if (mid.length > room) {
    const cut = mid.slice(0, Math.max(0, room - 1));
    mid = cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—–-]\s*$/, "") + "…";
  }
  return head + (room > 20 ? mid : "") + tail;
};

export const KEYWORDS = [
  "kitchen gadgets in Pakistan",
  "kitchen accessories online Pakistan",
  "home gadgets Pakistan",
  "vegetable chopper price in Pakistan",
  "electric chopper price in Pakistan",
  "coffee beater price in Pakistan",
  "handheld vacuum cleaner price in Pakistan",
  "kitchen sink organizer rack",
  "cash on delivery",
  "Homiqo",
];

const priceValidUntil = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export function productJsonLd(p: Product) {
  const url = abs(`/product/${p.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.name,
    description: p.description || p.short_description,
    image: p.images.map(abs),
    sku: p.slug,
    category: p.category,
    brand: { "@type": "Brand", name: STORE.name },
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: STORE.currency,
      price: p.price,
      priceValidUntil: priceValidUntil(),
      itemCondition: "https://schema.org/NewCondition",
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@id": `${SITE}/#organization` },
      acceptedPaymentMethod: "https://schema.org/COD",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: p.price >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE, currency: STORE.currency },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "PK" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 5, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PK",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function siteJsonLd() {
  const sameAs = [STORE.facebook, STORE.instagram, STORE.tiktok].filter(Boolean);
  return [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "@id": `${SITE}/#organization`,
      name: STORE.name,
      url: SITE,
      logo: abs("/logo-stacked.png"),
      description: `${STORE.tagline}. Cash on delivery across Pakistan.`,
      areaServed: { "@type": "Country", name: "Pakistan" },
      currenciesAccepted: STORE.currency,
      paymentAccepted: "Cash on Delivery",
      ...(STORE.email ? { email: STORE.email } : {}),
      ...(STORE.phone ? { telephone: STORE.phone } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: STORE.name,
      url: SITE,
      inLanguage: "en-PK",
      publisher: { "@id": `${SITE}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/shop?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

export function itemListJsonLd(products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/product/${p.slug}`), name: p.name })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** Safe JSON-LD script body (escapes "<" so product text can't break out of the tag). */
export const ld = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
