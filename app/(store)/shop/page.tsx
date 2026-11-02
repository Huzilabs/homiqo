import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import SetupNotice from "@/components/SetupNotice";
import SortSelect from "@/components/SortSelect";
import { getCategories, getProducts } from "@/lib/products";
import { supabaseConfigured } from "@/lib/supabase/server";
import { itemListJsonLd, ld } from "@/lib/seo";

type Params = Promise<{ category?: string; q?: string; sort?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const { category, q, sort } = await searchParams;
  if (q) return { title: `Search: ${q}`, robots: { index: false, follow: true } };
  const title = category ? `${category} — Buy Online in Pakistan` : "Shop All Kitchen Gadgets & Home Essentials in Pakistan";
  const description = category
    ? `Shop ${category.toLowerCase()} online in Pakistan at the best prices. Cash on delivery nationwide, 2–5 day delivery and 7-day returns.`
    : "Browse every Homiqo product — vegetable choppers, qeema makers, milk frothers, coffee makers, cordless vacuums, sink organizers and more. Cash on delivery across Pakistan.";
  const canonical = category ? `/shop?category=${encodeURIComponent(category)}` : "/shop";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { url: canonical, title, description },
    // sorted views are duplicates of the canonical listing
    ...(sort ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Params }) {
  if (!supabaseConfigured) return <SetupNotice />;
  const { category, q, sort } = await searchParams;
  const [products, categories] = await Promise.all([getProducts({ category, q, sort }), getCategories()]);

  const href = (c?: string) => {
    const sp = new URLSearchParams();
    if (c) sp.set("category", c);
    if (q) sp.set("q", q);
    if (sort) sp.set("sort", sort);
    const s = sp.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(itemListJsonLd(products))} />
      <section className="bg-sand">
        <div className="container-x py-16 text-center sm:py-24">
          <p className="eyebrow">{q ? "Search results" : "The collection"}</p>
          <h1 className="h-display mt-5">{q ? `“${q}”` : category || "Shop all"}</h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ink/60">
            {products.length} {products.length === 1 ? "piece" : "pieces"} · Cash on delivery across Pakistan
          </p>
        </div>
      </section>

      <div className="sticky top-[76px] z-20 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="container-x flex items-center justify-between gap-6 py-4">
          <div className="-mx-5 flex gap-7 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {[undefined, ...categories].map((c) => {
              const active = c ? category === c : !category;
              return (
                <Link
                  key={c || "all"}
                  href={href(c)}
                  className={`whitespace-nowrap border-b py-1.5 text-[11px] font-medium uppercase tracking-[.2em] transition ${
                    active ? "border-ink text-ink" : "border-transparent text-ink/50 hover:text-ink"
                  }`}
                >
                  {c || "All"}
                </Link>
              );
            })}
          </div>
          <div className="hidden shrink-0 sm:block"><SortSelect value={sort || ""} /></div>
        </div>
      </div>

      <div className="container-x pt-12">
        <div className="mb-8 sm:hidden"><SortSelect value={sort || ""} /></div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-7 lg:grid-cols-4">
            {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="font-serif text-3xl">Nothing found</p>
            <p className="mt-3 text-ink/60">Try a different search or category.</p>
            <Link href="/shop" className="btn-primary mt-8">View all products</Link>
          </div>
        )}
      </div>
    </>
  );
}
