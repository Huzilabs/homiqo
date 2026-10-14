import Link from "next/link";
import { ArrowRight, Banknote, CirclePlay, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import SetupNotice from "@/components/SetupNotice";
import { getProducts } from "@/lib/products";
import { supabaseConfigured } from "@/lib/supabase/server";
import VideoEmbed from "@/components/VideoEmbed";
import { discountPercent, formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/config";

export const dynamic = "force-dynamic";

const perks = [
  { icon: Banknote, title: "Cash on Delivery", text: "Pay when your parcel arrives" },
  { icon: Truck, title: "Fast nationwide delivery", text: `Free over ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
  { icon: RotateCcw, title: "7-day easy returns", text: "Not happy? Send it back" },
  { icon: ShieldCheck, title: "Quality checked", text: "Every item tested before dispatch" },
];

export default async function HomePage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const products = await getProducts();
  const featured = products.filter((p) => p.is_featured);
  const hero = featured[0] || products[0];
  const withVideo = products.filter((p) => p.videos.length > 0).slice(0, 3);
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="container-x relative grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
              🔥 New season sale — up to 40% off
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Make every kitchen task <span className="text-accent-400">faster</span> &amp; easier.
            </h1>
            <p className="mt-5 max-w-lg text-base text-brand-100 sm:text-lg">
              Choppers, qeema makers, coffee makers, cordless vacuums and smart organizers — tested, trusted and delivered to
              your door with Cash on Delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-accent px-7 py-3.5 text-base">
                Shop now <ArrowRight className="h-4 w-4" />
              </Link>
              {withVideo.length > 0 && (
                <a href="#videos" className="btn border border-white/30 px-7 py-3.5 text-base text-white hover:bg-white/10">
                  <CirclePlay className="h-5 w-5" /> Watch demos
                </a>
              )}
            </div>
          </div>
          {hero && (
            <Link
              href={`/product/${hero.slug}`}
              className="group relative mx-auto w-full max-w-md animate-fade-in rounded-3xl bg-white p-3 text-ink shadow-2xl"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50">
                <ProductImage src={hero.images[0]} alt={hero.name} priority sizes="(max-width:768px) 90vw, 450px" className="transition duration-500 group-hover:scale-105" />
                {discountPercent(hero.price, hero.compare_at_price) > 0 && (
                  <span className="absolute left-4 top-4 rounded-full bg-accent-500 px-3 py-1 text-sm font-bold text-white">
                    -{discountPercent(hero.price, hero.compare_at_price)}%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Best seller</p>
                  <p className="font-bold">{hero.name}</p>
                </div>
                <p className="whitespace-nowrap text-lg font-extrabold">{formatPrice(hero.price)}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-gray-100 bg-white">
        <div className="container-x grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-gray-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 1 && (
        <section className="container-x pt-14">
          <div className="flex flex-wrap gap-2">
            <Link href="/shop" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">All</Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/shop?category=${encodeURIComponent(c)}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-700"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-x pt-10">
          <SectionHead title="Best sellers" subtitle="Our customers’ favourites this month" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      {/* Videos */}
      {withVideo.length > 0 && (
        <section id="videos" className="mt-20 scroll-mt-24 bg-ink py-16 text-white">
          <div className="container-x">
            <SectionHead title="See them in action" subtitle="Real product demos — watch before you buy" dark />
            <div className="grid gap-6 md:grid-cols-3">
              {withVideo.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <VideoEmbed url={p.videos[0]} title={p.name} />
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-gray-400">{formatPrice(p.price)}</p>
                    </div>
                    <Link href={`/product/${p.slug}`} className="btn-accent px-4 py-2">Buy</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All products */}
      <section className="container-x pt-16">
        <SectionHead title="All products" subtitle="Everything you need for a smarter home" link="/shop" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="card p-10 text-center text-gray-500">No products yet. Add some from the admin panel.</p>
        )}
      </section>

      {/* CTA */}
      <section className="container-x pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-accent-500 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Order today, pay on delivery</h2>
          <p className="mx-auto mt-2 max-w-xl text-accent-50">
            No advance payment. Check your parcel, then pay the rider. Simple.
          </p>
          <Link href="/shop" className="btn mt-6 bg-white px-7 py-3.5 text-accent-600 hover:bg-accent-50">
            Browse the store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function SectionHead({ title, subtitle, link, dark }: { title: string; subtitle?: string; link?: string; dark?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className={`mt-1 text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</p>}
      </div>
      {link && (
        <Link href={link} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
