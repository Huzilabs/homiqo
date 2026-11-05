import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, RotateCcw, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import TrackItemList from "@/components/TrackItemList";
import { getProducts } from "@/lib/products";
import { categoryInfo, categoryPath } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { abs, breadcrumbJsonLd, ld } from "@/lib/seo";

// Static, edge-cached; refreshed when products change (see /api/revalidate) or every 5 minutes
export const revalidate = 300;

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  const products = await getProducts();
  const names = Array.from(new Set(products.map((p) => p.category)));
  const name = names.find((n) => categoryInfo(n).slug === slug);
  if (!name) return null;
  return { info: categoryInfo(name), products: products.filter((p) => p.category === name), others: names.filter((n) => n !== name) };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return Array.from(new Set(products.map((p) => categoryInfo(p.category).slug))).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Category not found", robots: { index: false } };
  const { info, products } = data;
  const path = `/category/${info.slug}`;
  return {
    title: info.title,
    description: info.description,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title: info.title,
      description: info.description,
      images: products.slice(0, 1).flatMap((p) => p.images.slice(0, 1)).map((u) => ({ url: abs(u), alt: info.h1 })),
    },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { info, products, others } = data;
  const path = `/category/${info.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: info.h1,
      description: info.description,
      url: abs(path),
      isPartOf: { "@id": `${abs("/")}#website` },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/product/${p.slug}`), name: p.name })),
      },
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
      { name: info.name, path },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(jsonLd)} />
      <TrackItemList listId={info.slug} listName={info.name} products={products} />

      <section className="bg-sand">
        <div className="container-x py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[.2em] text-ink/45">
            <Link href="/" className="hover:text-ink">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-ink">Shop</Link>
            <span>/</span>
            <span className="text-ink/80">{info.name}</span>
          </nav>
          <h1 className="h-display mt-6 max-w-3xl">{info.h1}</h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink/65 sm:text-base">{info.intro}</p>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[.18em] text-ink/55">
            <span className="inline-flex items-center gap-2"><Banknote className="h-4 w-4 text-brand-600" strokeWidth={1.5} /> Cash on delivery</span>
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-brand-600" strokeWidth={1.5} /> Free delivery · 2–5 days</span>
            <span className="inline-flex items-center gap-2"><RotateCcw className="h-4 w-4 text-brand-600" strokeWidth={1.5} /> 7-day returns</span>
          </p>
        </div>
      </section>

      <div className="container-x pt-12">
        <p className="mb-6 text-sm text-ink/55">{products.length} {products.length === 1 ? "product" : "products"}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-7 lg:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </div>
      </div>

      {info.sections.length > 0 && (
        <section className="container-x pt-24">
          <div className="grid gap-10 border-t border-ink/10 pt-14 lg:grid-cols-[1fr_2fr]">
            <h2 className="h-section">Buying guide</h2>
            <div className="space-y-8">
              {info.sections.map((s) => (
                <div key={s.heading}>
                  <h3 className="font-serif text-2xl font-medium text-ink">{s.heading}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="container-x pt-20">
          <h2 className="eyebrow">Explore more categories</h2>
          <ul className="mt-5 flex flex-wrap gap-3">
            {others.map((n) => (
              <li key={n}>
                <Link href={categoryPath(n)} className="inline-block border border-ink/15 px-5 py-3 text-sm text-ink transition hover:border-ink">
                  {n}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/shop" className="inline-block border border-ink/15 px-5 py-3 text-sm text-ink transition hover:border-ink">All products</Link>
            </li>
          </ul>
        </section>
      )}
    </>
  );
}
