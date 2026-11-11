import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import Faq from "@/components/Faq";
import RichText from "@/components/RichText";
import ReadMore from "@/components/ReadMore";
import Stars from "@/components/Stars";
import UrgencyBox from "@/components/UrgencyBox";
import { recentOrders } from "@/lib/recent";
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

  const [rv, recent] = await Promise.all([getProductReviews(product.id), recentOrders(product.id)]);
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
          <MediaGallery name={product.name} images={product.images} videos={preview ? [preview] : []} />

          <div className="min-w-0 lg:pt-2">
            <p className="eyebrow hidden lg:block">{product.category}</p>
            <h1 className="text-[1.3rem] font-semibold leading-snug text-ink [text-wrap:wrap] lg:mt-3 lg:[text-wrap:balance] lg:font-serif lg:text-[2.75rem] lg:font-medium lg:leading-[1.05]">{product.name}</h1>
            {rv.count > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink">
                <Stars rating={rv.average} /> <span className="font-medium text-ink">{rv.average.toFixed(1)}</span> · {rv.count} review{rv.count === 1 ? "" : "s"}
              </a>
            )}
            <p className="mt-3 hidden text-[16px] leading-relaxed text-ink/65 lg:line-clamp-2 lg:block">{product.short_description}</p>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2 lg:mt-5 lg:gap-x-4 lg:border-t lg:border-ink/10 lg:pt-5">
              <span className={`text-[1.6rem] font-bold lg:font-serif lg:text-4xl lg:font-normal ${off > 0 ? "text-accent-700" : "text-ink"}`}>{formatPrice(product.price)}</span>
              {off > 0 && (
                <>
                  <span className="text-base text-ink/35 line-through lg:text-lg">{formatPrice(product.compare_at_price!)}</span>
                  <span className="inline-flex h-7 items-center border border-accent-600 bg-accent-600 px-2.5 text-[12px] font-semibold tracking-[.04em] text-white">Save {off}%</span>
                </>
              )}
              {Number(product.bundle_save) > 0 && !(product.components || []).length && product.stock >= 2 && (
                <span className="inline-flex h-7 items-center border border-accent-600 bg-accent-50 px-2.5 text-[12px] font-semibold tracking-[.04em] text-accent-700">
                  🎁 Buy 2, save {formatPrice(Number(product.bundle_save))}
                </span>
              )}
            </div>
            {off > 0 && (
              <p className="mt-1 text-sm font-medium text-accent-700">You save {formatPrice(product.compare_at_price! - product.price)}</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium text-leaf-600 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-1.5 lg:border lg:border-leaf-600/20 lg:bg-leaf-100/40 lg:px-4 lg:py-2.5 lg:text-[13px] lg:text-ink/80">
              <li>✓ Cash on delivery</li>
              <li>✓ Free delivery</li>
              <li>✓ Open parcel before paying</li>
              <li>✓ 7-day replacement</li>
            </ul>

            <ProductActions product={product} />


            <p className={`mt-4 text-[12px] uppercase tracking-[.18em] ${product.stock > 0 ? "text-leaf-600" : "text-rose-700"}`}>
              {product.stock > 0 ? "In stock · ready to ship" : "Out of stock"}
              {product.stock > 0 && <span className="ml-2 hidden normal-case tracking-normal text-ink/50 lg:inline">· or pay by bank transfer for {BANK.discountPct}% off</span>}
            </p>

            <UrgencyBox stock={product.stock} saleEndsAt={product.sale_ends_at} hasDiscount={off > 0} recentOrders={recent} />

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

            {product.features.length > 0 && (
              <div className="mt-6 lg:mt-10">
                <p className="label">Highlights</p>
                <ul className="mt-2 space-y-1.5 lg:space-y-0">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink/80 lg:items-center lg:gap-4 lg:border-b lg:border-ink/10 lg:py-3.5 lg:text-[15px]">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500 lg:mt-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10 bg-sand py-8 lg:mt-16 lg:py-24">
        <div className="container-x grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
          <div>
            <p className="eyebrow hidden lg:block">The details</p>
            <h2 className="text-lg font-semibold text-ink lg:h-section lg:mt-4">
              <span className="lg:hidden">Description</span>
              <span className="hidden lg:inline">About the {product.name}</span>
            </h2>
            <div className="mt-3 lg:mt-8">
              <ReadMore><RichText text={product.description || product.short_description} /></ReadMore>
            </div>
          </div>
          <div className="lg:pt-16">
            <h2 className="mb-3 text-lg font-semibold text-ink lg:eyebrow lg:mb-6">
              <span className="lg:hidden">Questions</span>
              <span className="hidden lg:inline">{product.name} — questions, answered</span>
            </h2>
            <Faq items={faqs} />
          </div>
        </div>
      </section>

      {rv.count > 0 && (
      <section id="reviews" className="container-x scroll-mt-28 pt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <p className="eyebrow">Verified customers</p>
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
              <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-ink/60">No reviews yet. Reviews come only from customers who received this product — after delivery we send you a link to share yours.</p>
            )}
          </div>
          {rv.count > 0 && (
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
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
