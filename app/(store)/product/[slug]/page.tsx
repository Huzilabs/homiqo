import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, Check, ChevronRight, RotateCcw, Truck } from "lucide-react";
import MediaGallery from "@/components/MediaGallery";
import ProductActions from "@/components/ProductActions";
import Faq from "@/components/Faq";
import ProductCard from "@/components/ProductCard";
import VideoEmbed from "@/components/VideoEmbed";
import { getProductBySlug, getProducts } from "@/lib/products";
import { discountPercent, formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, STORE } from "@/lib/config";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.short_description,
    openGraph: { title: p.name, description: p.short_description, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await getProducts()).filter((p) => p.id !== product.id).slice(0, 4);
  const off = discountPercent(product.price, product.compare_at_price);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description,
    image: product.images,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: STORE.currency,
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${STORE.siteUrl}/product/${product.slug}`,
    },
  };

  return (
    <div className="container-x pb-24 pt-6 sm:pt-10 lg:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 flex items-center gap-1 text-sm text-gray-500">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">
          {product.category}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <MediaGallery name={product.name} images={product.images} videos={product.videos} />

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{product.category}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-gray-600">{product.short_description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold">{formatPrice(product.price)}</span>
            {off > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_at_price!)}</span>
                <span className="rounded-full bg-accent-50 px-3 py-1 text-sm font-bold text-accent-600">
                  Save {formatPrice(product.compare_at_price! - product.price)}
                </span>
              </>
            )}
          </div>

          <p className={`mt-3 text-sm font-medium ${product.stock > 0 ? "text-brand-700" : "text-rose-600"}`}>
            {product.stock > 10
              ? "● In stock — ready to ship"
              : product.stock > 0
                ? `● Hurry! Only ${product.stock} left`
                : "● Out of stock"}
          </p>

          <ProductActions product={product} />

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
            <Truck className="h-5 w-5 shrink-0 text-brand-600" />
            <span>
              Order now, get it between <b>{deliveryWindow()}</b>
            </span>
          </div>

          <div className="mt-3 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2"><Banknote className="h-5 w-5 text-brand-600" /> Cash on Delivery</div>
            <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-brand-600" /> Free over {formatPrice(FREE_SHIPPING_THRESHOLD)}</div>
            <div className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-brand-600" /> 7-day returns</div>
          </div>

          {product.features.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold">Key features</h2>
              <ul className="mt-3 space-y-2.5">
                {product.features.map((f) => (
                  <li key={f} className="flex gap-3 text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {product.description && (
          <div>
            <h2 className="text-2xl font-extrabold">Product details</h2>
            <div className="mt-4 whitespace-pre-line text-lg leading-relaxed text-gray-700">{product.description}</div>
          </div>
        )}
        <div>
          <h2 className="mb-4 text-2xl font-extrabold">Good to know</h2>
          <Faq
            items={[
              { q: "Delivery & charges", a: `Delivered in 2–5 working days across Pakistan. ${formatPrice(SHIPPING_FEE)} delivery, free on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}.` },
              { q: "Cash on Delivery", a: "No advance payment — pay the rider in cash when your parcel arrives." },
              { q: "Returns & warranty", a: "Damaged or faulty? Contact us within 7 days of delivery for a free replacement or refund." },
            ]}
          />
        </div>
      </section>

      {product.videos.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold">Watch it in action</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {product.videos.map((v, i) => (
              <div key={v} className="overflow-hidden rounded-2xl shadow-card">
                <VideoEmbed url={v} title={`${product.name} video ${i + 1}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-extrabold">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function deliveryWindow() {
  const fmt = (d: number) =>
    new Date(Date.now() + d * 864e5).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
  return `${fmt(2)} – ${fmt(5)}`;
}
