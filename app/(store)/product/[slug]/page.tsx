import type { Metadata } from "next";
import WriteReview from "@/components/WriteReview";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, ChevronDown, CircleCheck, MessageCircle, PackageOpen, Truck } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import Faq from "@/components/Faq";
import RichText from "@/components/RichText";
import Stars from "@/components/Stars";
import { DealTimer } from "@/components/UrgencyBox";
import { recentOrderCounts } from "@/lib/recent";
import { getProductReviews } from "@/lib/reviews";
import { categoryPath } from "@/lib/categories";
import MediaGallery from "@/components/MediaGallery";
import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getProducts } from "@/lib/products";
import { discountPercent, formatPrice, previewVideo } from "@/lib/format";
import { BANK, STORE } from "@/lib/config";
import { abs, breadcrumbJsonLd, faqJsonLd, ld, productDescription, productJsonLd, productTitle } from "@/lib/seo";

// Static pages served from Vercel's edge cache; refreshed when products change (see /api/revalidate) or every 5 minutes
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found", robots: { index: false } };
  const title = productTitle(p);
  const description = productDescription(p);
  const path = `/product/${p.slug}`;
  return {
    title,
    description,
    keywords: [p.name, `${p.name} price in Pakistan`, `${p.category} Pakistan`, "cash on delivery", STORE.name],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      images: p.images.slice(0, 4).map((u) => ({ url: abs(u), alt: p.name })),
    },
    twitter: { card: "summary_large_image", title, description, images: p.images.slice(0, 1).map(abs) },
    other: {
      "product:price:amount": String(p.price),
      "product:price:currency": STORE.currency,
      "product:availability": p.stock > 0 ? "in stock" : "out of stock",
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const all = await getProducts();
  const sameCategory = all.filter((p) => p.id !== product.id && p.category === product.category);
  const related = [...sameCategory, ...all.filter((p) => p.id !== product.id && p.category !== product.category)].slice(0, 4);
  const off = discountPercent(product.price, product.compare_at_price);
  const byId = new Map(all.map((p) => [p.id, p]));
  const included = (product.components || []).map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const combos = all
    .filter((c) => c.id !== product.id && (c.components || []).includes(product.id))
    .map((c) => ({ c, parts: (c.components || []).map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p)) }))
    .filter(({ c, parts }) => parts.length === (c.components || []).length && parts.reduce((s, p) => s + Number(p.price), 0) > Number(c.price));
  const preview = previewVideo(product.videos);

  const [rv, counts] = await Promise.all([getProductReviews(product.id), recentOrderCounts()]);
  const recent = counts[product.id] || 0;
  // "Customers also bought": best sellers of the last 7 days (other in-stock products)
  const alsoBought = all
    .filter((p) => p.id !== product.id && p.stock > 0 && !(p.components || []).includes(product.id))
    .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
    .slice(0, 2);
  const topFeatures = product.features.slice(0, 4);
  const productFaqs = (product.faqs || []).filter((f) => f?.q && f?.a);
  const faqs = [
    ...productFaqs,
    { q: "Delivery & charges", a: `Delivered in 2–5 working days across Pakistan. Delivery is free on every order. Pay by bank transfer to get ${BANK.discountPct}% off.` },
    { q: "Cash on delivery", a: "No advance payment. You can open the parcel and check the product in front of the rider, then pay in cash." },
    { q: "Returns & warranty", a: "Damaged or faulty? Contact us within 7 days of delivery for a free replacement or refund." },
  ];

  const jsonLd = [
    productJsonLd(product, rv),
    faqJsonLd(faqs),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: product.category, path: categoryPath(product.category) },
      { name: product.name, path: `/product/${product.slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(jsonLd)} />
      <div className="container-x pb-4 pt-3 lg:pb-10 lg:pt-8">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <MediaGallery name={product.name} images={product.images} videos={preview ? [preview] : []} productId={product.id} badge={off > 0 ? `-${off}%` : undefined} />

          <div className="min-w-0 lg:pt-2">
            {/* price + real countdown first (deal style), then the name */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={`text-[30px] font-extrabold leading-none lg:text-[36px] ${off > 0 ? "text-accent-600" : "text-ink"}`}>{formatPrice(product.price)}</span>
              {off > 0 && <span className="text-[15px] text-ink/40 line-through lg:text-[17px]">{formatPrice(product.compare_at_price!)}</span>}
              {off > 0 && <span className="text-[13px] font-semibold text-accent-700">You save {formatPrice(product.compare_at_price! - product.price)}</span>}
            </div>
            {product.stock > 0 && <div className="mt-3"><DealTimer saleEndsAt={product.sale_ends_at} hasDiscount={off > 0} /></div>}
            <h1 className="mt-3 text-[19px] font-semibold leading-snug text-ink lg:text-[28px] lg:leading-tight">{product.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
              {rv.count > 0 && (
                <a href="#reviews" className="inline-flex items-center gap-1.5 text-ink/70 hover:text-ink">
                  <Stars rating={rv.average} /> <span className="font-medium text-ink">{rv.average.toFixed(1)}</span> ({rv.count})
                </a>
              )}
              {recent >= 3 && <span className="text-ink/60">{rv.count > 0 ? "· " : ""}{recent} sold this week</span>}
              <span className={`ml-auto font-semibold ${product.stock > 0 ? (product.stock <= 5 ? "text-rose-700" : "text-leaf-600") : "text-rose-700"}`}>
                {product.stock <= 0 ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
              </span>
            </div>

            {/* the three promises that decide a COD purchase */}
            <ul className="mt-4 grid grid-cols-3 gap-2 border border-ink/10 bg-white px-2 py-3.5 text-center text-[12px] font-semibold leading-tight text-ink">
              {[
                { icon: <Truck className="h-[22px] w-[22px] text-brand-600" strokeWidth={1.8} />, label: "Free delivery" },
                { icon: <PackageOpen className="h-[22px] w-[22px] text-brand-600" strokeWidth={1.8} />, label: "Open & check" },
                { icon: <Banknote className="h-[22px] w-[22px] text-brand-600" strokeWidth={1.8} />, label: "Cash on delivery" },
              ].map((x) => (
                <li key={x.label} className="flex flex-col items-center gap-1.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">{x.icon}</span>
                  {x.label}
                </li>
              ))}
            </ul>

            {topFeatures.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {topFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[14px] leading-snug text-ink/85">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" /> {f}
                  </li>
                ))}
              </ul>
            )}

            <ProductActions product={product} />

            {alsoBought.length > 0 && (
              <div className="mt-6">
                <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-ink/55">Customers also bought</p>
                <div className="mt-2 grid grid-cols-2 gap-2.5">
                  {alsoBought.map((p) => (
                    <Link key={p.id} href={`/product/${p.slug}`} className="group flex gap-2.5 border border-ink/10 bg-white p-2 transition hover:border-ink/40">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden bg-sand">
                        <ProductImage src={p.images[0]} alt={p.name} sizes="56px" />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-[12.5px] font-medium leading-snug text-ink group-hover:underline">{p.name}</span>
                        <span className="mt-0.5 block text-[13px] font-bold text-accent-700">{formatPrice(p.price)}</span>
                        {Number(p.bundle_save) > 0 && <span className="block text-[11px] text-leaf-600">Buy 2, save {formatPrice(Number(p.bundle_save))}</span>}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}



            {included.length > 0 && (
              <div className="mt-6 border border-ink/10 bg-white p-4">
                <p className="label">What’s in this combo</p>
                <ul className="mt-2 space-y-2">
                  {included.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <Link href={`/product/${p.slug}`} className="font-medium text-ink hover:underline">✓ {p.name}</Link>
                      <span className="whitespace-nowrap text-ink/45 line-through">{formatPrice(p.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm font-semibold text-accent-700">
                  Combo price {formatPrice(product.price)} — you save {formatPrice(included.reduce((s, p) => s + Number(p.price), 0) - Number(product.price))}
                </p>
              </div>
            )}
            {combos.map(({ c, parts }) => (
              <Link
                key={c.id}
                href={`/product/${c.slug}`}
                className="mt-6 flex items-center justify-between gap-3 border border-accent-500/40 bg-accent-50 px-4 py-3 text-sm hover:border-accent-600"
              >
                <span className="text-ink/80">
                  🎁 <b className="text-accent-700">Combo deal:</b> {parts.filter((p) => p.id !== product.id).map((p) => p.name).join(" + ")} + this for{" "}
                  <b>{formatPrice(c.price)}</b> (save {formatPrice(parts.reduce((s, p) => s + Number(p.price), 0) - Number(c.price))})
                </span>
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[.14em] text-accent-700">View →</span>
              </Link>
            ))}

            <p className="mt-4 text-sm text-ink/65">
              🚚 Delivery by <span className="font-medium text-ink">{deliveryWindow()}</span>
            </p>
            {STORE.whatsapp && (
              <a
                href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum, I have a question about the ${product.name} (${formatPrice(product.price)}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 hidden items-center gap-2 text-sm font-medium text-[#128C7E] hover:underline lg:inline-flex"
              >
                <MessageCircle className="h-4 w-4" /> Questions? Ask us on WhatsApp
              </a>
            )}

            {/* product details as collapsible sections, right under the buy area */}
            <div className="mt-5 divide-y divide-ink/10 border border-ink/10 bg-white px-4 lg:mt-6">
              {[
                {
                  title: "About the Product",
                  body: (
                    <>
                      <RichText simple text={product.description || product.short_description} />
                      {product.features.length > topFeatures.length && (
                        <ul className="mt-4 space-y-1.5 text-[15px] leading-7 text-ink/75">
                          {product.features.slice(topFeatures.length).map((f) => (
                            <li key={f} className="flex gap-3"><span className="mt-[0.75em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60" />{f}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  ),
                },
                {
                  title: "Delivery Information",
                  body: (
                    <ul className="space-y-2.5 text-[15px] leading-7 text-ink/75">
                      {[
                        ["Free delivery:", `All over Pakistan in 2–5 working days — expected ${deliveryWindow()}.`],
                        ["Cash on delivery:", "No advance payment. Open the parcel and check the product in front of the rider, then pay."],
                        ["Pay only the order amount:", "Delivery is already paid by us — never pay the rider anything extra."],
                        ["Bank transfer:", `Prefer to pay in advance? Pay by bank transfer and get ${BANK.discountPct}% off.`],
                      ].map(([b, t]) => (
                        <li key={b} className="flex gap-3"><span className="mt-[0.75em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60" /><span><b className="font-semibold text-ink">{b}</b> {t}</span></li>
                      ))}
                    </ul>
                  ),
                },
                {
                  title: "Returns, Exchanges & Warranty",
                  body: (
                    <ul className="space-y-2.5 text-[15px] leading-7 text-ink/75">
                      {[
                        ["7-day replacement:", "If the product arrives damaged or faulty, message us within 7 days of delivery for a free replacement or refund."],
                        ["Check before you pay:", "You can open the parcel in front of the rider — if anything is wrong, don't accept it and call us."],
                        ["How to claim:", `WhatsApp us your order number and a photo or video of the problem${STORE.phone ? ` (${STORE.phone})` : ""}.`],
                      ].map(([b, t]) => (
                        <li key={b} className="flex gap-3"><span className="mt-[0.75em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60" /><span><b className="font-semibold text-ink">{b}</b> {t}</span></li>
                      ))}
                    </ul>
                  ),
                },
                ...(productFaqs.length ? [{ title: "Questions & Answers", body: <Faq items={productFaqs} /> }] : []),
              ].map((sec) => (
                <details key={sec.title} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {sec.title}
                    <ChevronDown className="h-5 w-5 shrink-0 text-ink/60 transition group-open:rotate-180" />
                  </summary>
                  <div className="pb-4">{sec.body}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>


      {rv.count === 0 ? (
        <section id="reviews" className="container-x scroll-mt-28 pt-10 lg:pt-16">
          <div className="flex flex-col items-start justify-between gap-4 border border-ink/10 bg-white px-5 py-5 sm:flex-row sm:items-center lg:px-8 lg:py-6">
            <div>
              <p className="text-lg tracking-[.15em] text-ink/25" aria-hidden>★★★★★</p>
              <p className="mt-1 font-semibold text-ink">No reviews yet</p>
              <p className="text-sm text-ink/60">Bought the {product.name}? Share your experience — it helps other customers.</p>
            </div>
            <WriteReview productId={product.id} productName={product.name} compact />
          </div>
        </section>
      ) : (
      <section id="reviews" className="container-x scroll-mt-28 pt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="eyebrow">What customers say</p>
            <h2 className="h-section mt-4">Customer reviews</h2>
            {rv.count > 0 ? (
              <div className="mt-6">
                <p className="flex items-center gap-3">
                  <span className="font-serif text-5xl text-ink">{rv.average.toFixed(1)}</span>
                  <span>
                    <Stars rating={rv.average} size="h-5 w-5" />
                    <span className="mt-1 block text-sm text-ink/60">Based on {rv.count} review{rv.count === 1 ? "" : "s"}</span>
                  </span>
                </p>
                <ul className="mt-6 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const c = rv.reviews.filter((r) => r.rating === n).length;
                    return (
                      <li key={n} className="flex items-center gap-3 text-xs text-ink/60">
                        <span className="w-3">{n}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10"><span className="block h-full rounded-full bg-accent-500" style={{ width: `${(c / rv.count) * 100}%` }} /></span>
                        <span className="w-5 text-right tabular-nums">{c}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-ink/60">No reviews yet. Bought this product? Be the first to share your experience.</p>
            )}
            <WriteReview productId={product.id} productName={product.name} />
          </div>
          {rv.count > 0 && (
            <ul className="max-h-[440px] divide-y divide-ink/10 overflow-y-auto border-y border-ink/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:max-h-[560px]">
              {rv.reviews.slice(0, 20).map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars rating={r.rating} />
                    <span className="text-sm font-semibold text-ink">{r.name}</span>
                    {r.city && <span className="text-sm text-ink/50">{r.city}</span>}
                    {r.verified && <span className="text-[11px] font-medium uppercase tracking-wider text-leaf-600">✓ Verified purchase</span>}
                    <span className="ml-auto text-xs text-ink/40">{new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  {r.comment && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink/75">{r.comment}</p>}
                  {r.photo_url && (
                    <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.photo_url} alt={`Photo from ${r.name}`} loading="lazy" className="h-28 w-28 object-cover" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      )}

      {related.length > 0 && (
        <section className="container-x pt-10 lg:pt-28">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <p className="eyebrow">Complete the kitchen</p>
              <h2 className="h-section mt-4">{sameCategory.length ? `More ${product.category.toLowerCase()}` : "You may also like"}</h2>
            </div>
            <Link href={categoryPath(product.category)} className="link-arrow self-start sm:shrink-0 sm:self-auto sm:pb-2">All {product.category.toLowerCase()} →</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-7 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

    </>
  );
}

function deliveryWindow() {
  const fmt = (d: number) => new Date(Date.now() + d * 864e5).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
  return `${fmt(2)} – ${fmt(5)}`;
}
