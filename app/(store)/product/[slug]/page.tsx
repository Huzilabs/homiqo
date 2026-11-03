import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, MessageCircle, RotateCcw, Truck } from "lucide-react";
import Faq from "@/components/Faq";
import RichText from "@/components/RichText";
import { categoryPath } from "@/lib/categories";
import MediaGallery from "@/components/MediaGallery";
import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getProducts } from "@/lib/products";
import { discountPercent, formatPrice, previewVideo } from "@/lib/format";
import { BANK, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, STORE } from "@/lib/config";
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
  const preview = previewVideo(product.videos);

  const productFaqs = (product.faqs || []).filter((f) => f?.q && f?.a);
  const faqs = [
    ...productFaqs,
    { q: "Delivery & charges", a: `Delivered in 2–5 working days across Pakistan. ${formatPrice(SHIPPING_FEE)} delivery, complimentary on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}.` },
    { q: "Cash on delivery", a: "No advance payment — pay the rider in cash when your parcel arrives." },
    { q: "Returns & warranty", a: "Damaged or faulty? Contact us within 7 days of delivery for a free replacement or refund." },
  ];

  const jsonLd = [
    productJsonLd(product),
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
      <div className="container-x pb-28 pt-8 lg:pb-10">
        <nav className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[.2em] text-ink/45">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span>/</span>
          <Link href={categoryPath(product.category)} className="hover:text-ink">{product.category}</Link>
          <span>/</span>
          <span className="truncate text-ink/80">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <MediaGallery name={product.name} images={product.images} videos={preview ? [preview] : []} />

          <div className="lg:pt-6">
            <p className="eyebrow">{product.category}</p>
            <h1 className="mt-4 font-serif text-[2.6rem] font-medium leading-[1.05] text-ink sm:text-[3.4rem]">{product.name}</h1>
            <p className="mt-5 text-[17px] leading-relaxed text-ink/65">{product.short_description}</p>

            <div className="mt-8 flex flex-wrap items-baseline gap-4 border-t border-ink/10 pt-8">
              <span className={`font-serif text-4xl ${off > 0 ? "text-accent-700" : "text-ink"}`}>{formatPrice(product.price)}</span>
              {off > 0 && (
                <>
                  <span className="text-lg text-ink/35 line-through">{formatPrice(product.compare_at_price!)}</span>
                  <span className="bg-accent-600 px-2.5 py-1 text-[11px] font-medium tracking-[.12em] text-white">SAVE {off}%</span>
                </>
              )}
            </div>
            {off > 0 && (
              <p className="mt-2 text-sm font-medium text-accent-700">You save {formatPrice(product.compare_at_price! - product.price)}</p>
            )}
            <p className="mt-2 text-sm text-ink/60">
              Delivery {formatPrice(SHIPPING_FEE)} · free over {formatPrice(FREE_SHIPPING_THRESHOLD)} · or pay by bank transfer for {BANK.discountPct}% off + free delivery
            </p>
            <p className={`mt-3 text-[12px] uppercase tracking-[.18em] ${product.stock > 0 ? "text-leaf-600" : "text-rose-700"}`}>
              {product.stock > 10 ? "In stock · ready to ship" : product.stock > 0 ? `Only ${product.stock} left in stock` : "Out of stock"}
            </p>

            <ProductActions product={product} />

            <p className="mt-6 text-sm text-ink/65">
              Order today — arrives <span className="font-medium text-ink">{deliveryWindow()}</span>. No advance payment: pay the rider in cash when it arrives.
            </p>
            {STORE.whatsapp && (
              <a
                href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum, I have a question about the ${product.name} (${formatPrice(product.price)}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#128C7E] hover:underline"
              >
                <MessageCircle className="h-4 w-4" /> Questions? Ask us on WhatsApp
              </a>
            )}

            <div className="mt-8 grid grid-cols-3 border-y border-ink/10">
              {[
                { icon: Banknote, t: "Cash on delivery" },
                { icon: Truck, t: `Free over ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
                { icon: RotateCcw, t: "7-day returns" },
              ].map(({ icon: Icon, t }, i) => (
                <div key={t} className={`flex flex-col items-center gap-2 px-2 py-5 text-center ${i ? "border-l border-ink/10" : ""}`}>
                  <Icon className="h-5 w-5 text-brand-600" strokeWidth={1.25} />
                  <span className="text-[10px] uppercase leading-snug tracking-[.16em] text-ink/60">{t}</span>
                </div>
              ))}
            </div>

            {product.features.length > 0 && (
              <div className="mt-10">
                <p className="label">Highlights</p>
                <ul className="mt-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-center gap-4 border-b border-ink/10 py-3.5 text-[15px] text-ink/80">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-16 bg-sand py-24">
        <div className="container-x grid gap-14 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
          <div>
            <p className="eyebrow">The details</p>
            <h2 className="h-section mt-4">About the {product.name}</h2>
            <div className="mt-8"><RichText text={product.description || product.short_description} /></div>
          </div>
          <div className="lg:pt-16">
            <h2 className="eyebrow mb-6">{product.name} — questions, answered</h2>
            <Faq items={faqs} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-x pt-28">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Complete the kitchen</p>
              <h2 className="h-section mt-4">{sameCategory.length ? `More ${product.category.toLowerCase()}` : "You may also like"}</h2>
            </div>
            <Link href={categoryPath(product.category)} className="link-arrow shrink-0 pb-2">All {product.category.toLowerCase()} →</Link>
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
