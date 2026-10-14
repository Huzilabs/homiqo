import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Banknote, CirclePlay, Headphones, PackageCheck, Phone, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import Countdown from "@/components/Countdown";
import Faq from "@/components/Faq";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import SetupNotice from "@/components/SetupNotice";
import VideoShowcase from "@/components/VideoShowcase";
import { getProducts } from "@/lib/products";
import { supabaseConfigured } from "@/lib/supabase/server";
import { discountPercent, formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, STORE } from "@/lib/config";
import { HERO_IMAGE, LIFESTYLE_IMAGE } from "@/lib/media";

export const dynamic = "force-dynamic";

const perks = [
  { icon: Banknote, title: "Cash on Delivery", text: "Pay when it reaches you" },
  { icon: Truck, title: "Nationwide delivery", text: `Free over ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
  { icon: RotateCcw, title: "7-day returns", text: "Hassle-free exchange" },
  { icon: ShieldCheck, title: "Quality checked", text: "Tested before dispatch" },
];

const faqs = [
  { q: "How does Cash on Delivery work?", a: "Place your order online without paying anything. Our rider delivers to your door and you pay in cash after receiving the parcel." },
  { q: "How long does delivery take?", a: "Most orders arrive within 2–5 working days anywhere in Pakistan. Big cities like Karachi, Lahore and Islamabad are usually faster." },
  { q: "How much is delivery?", a: `Delivery is ${formatPrice(SHIPPING_FEE)} per order, and completely free on orders of ${formatPrice(FREE_SHIPPING_THRESHOLD)} or more.` },
  { q: "What if the product is damaged or not working?", a: "Contact us within 7 days of delivery and we’ll replace it or refund you. Please keep the original packaging." },
  { q: "How can I track my order?", a: "Use the Track Order page with your order number and phone number to see live status, courier and tracking number." },
];

export default async function HomePage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const products = await getProducts();
  const featured = products.filter((p) => p.is_featured);
  const deal = [...products].filter((p) => p.stock > 0).sort((a, b) => discountPercent(b.price, b.compare_at_price) - discountPercent(a.price, a.compare_at_price))[0];
  const withVideo = products.filter((p) => p.videos.length > 0).slice(0, 4);
  const categories = Array.from(new Set(products.map((p) => p.category))).map((c) => ({
    name: c,
    image: products.find((p) => p.category === c && p.images[0])?.images[0],
    count: products.filter((p) => p.category === c).length,
  }));
  const heroPicks = (featured.length ? featured : products).slice(0, 2);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <div className="container-x grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-400 ring-1 ring-accent-400/30">
              🔥 Season sale · up to 40% off
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Smart tools for a <span className="bg-gradient-to-r from-accent-400 to-amber-300 bg-clip-text text-transparent">happier kitchen.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/75">
              Qeema makers, choppers, coffee makers, cordless vacuums &amp; more — demo-tested, delivered anywhere in Pakistan. Pay only when it arrives.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-accent px-8 py-4 text-base shadow-lg shadow-accent-500/30">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#videos" className="btn border border-white/25 bg-white/5 px-7 py-4 text-base text-white backdrop-blur hover:bg-white/10">
                <CirclePlay className="h-5 w-5" /> Watch demos
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-accent-400" /> Cash on Delivery</span>
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent-400" /> 2–5 day delivery</span>
              <span className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-accent-400" /> 7-day returns</span>
            </div>
          </div>
          <div className="relative hidden h-[460px] lg:block">
            {heroPicks.map((p, i) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className={`absolute w-[300px] overflow-hidden rounded-3xl bg-white text-ink shadow-2xl ring-1 ring-black/5 transition hover:-translate-y-1 ${
                  i === 0 ? "right-28 top-0 rotate-[-3deg]" : "bottom-0 right-0 rotate-[3deg]"
                }`}
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  <ProductImage src={p.images[0]} alt={p.name} sizes="300px" priority />
                  {discountPercent(p.price, p.compare_at_price) > 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-accent-500 px-2.5 py-1 text-xs font-bold text-white">
                      -{discountPercent(p.price, p.compare_at_price)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <p className="line-clamp-1 text-sm font-bold">{p.name}</p>
                  <p className="whitespace-nowrap font-extrabold text-brand-700">{formatPrice(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="relative z-10 -mt-px border-b border-gray-100 bg-white">
        <div className="container-x grid grid-cols-2 divide-gray-100 lg:grid-cols-4 lg:divide-x">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 px-2 py-6 lg:justify-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-gray-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="container-x pt-16">
          <SectionHead eyebrow="Browse" title="Shop by category" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.name} href={`/shop?category=${encodeURIComponent(c.name)}`} className="group relative aspect-[3/4] overflow-hidden rounded-3xl bg-gray-200 sm:aspect-[4/5]">
                <ProductImage src={c.image} alt={c.name} sizes="(max-width:1024px) 50vw, 25vw" className="transition duration-700 group-hover:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white sm:p-5">
                  <span>
                    <span className="block text-base font-bold sm:text-lg">{c.name}</span>
                    <span className="text-xs text-white/75">{c.count} product{c.count === 1 ? "" : "s"}</span>
                  </span>
                  <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-white text-ink transition group-hover:translate-x-1 sm:flex">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* BEST SELLERS */}
      <section className="container-x pt-20">
        <SectionHead eyebrow="Customer favourites" title="Best sellers" link="/shop" />
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {(featured.length ? featured : products).slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* DEAL OF THE DAY */}
      {deal && (
        <section className="container-x pt-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-900 to-ink text-white">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent-500/25 blur-3xl" />
            <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
                <ProductImage src={deal.images[0]} alt={deal.name} sizes="(max-width:1024px) 100vw, 50vw" />
                <span className="absolute left-4 top-4 rounded-full bg-accent-500 px-4 py-1.5 text-sm font-extrabold">
                  SAVE {discountPercent(deal.price, deal.compare_at_price)}%
                </span>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-accent-400">Deal of the day</p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{deal.name}</h2>
                <p className="mt-3 text-white/70">{deal.short_description}</p>
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold">{formatPrice(deal.price)}</span>
                  {deal.compare_at_price && <span className="text-xl text-white/50 line-through">{formatPrice(deal.compare_at_price)}</span>}
                </div>
                <p className="mb-3 mt-8 text-sm text-white/60">Offer refreshes in</p>
                <Countdown />
                <Link href={`/product/${deal.slug}`} className="btn-accent mt-8 px-8 py-4 text-base">
                  Grab this deal <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VIDEOS */}
      {withVideo.length > 0 && (
        <section id="videos" className="mt-20 scroll-mt-24 bg-ink py-20 text-white">
          <div className="container-x">
            <SectionHead eyebrow="See it before you buy" title="Watch & shop" subtitle="Real product demos — tap to play" dark />
            <VideoShowcase products={withVideo} />
          </div>
        </section>
      )}

      {/* ALL PRODUCTS */}
      <section className="container-x pt-20">
        <SectionHead eyebrow="The full range" title="All products" link="/shop" />
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.length === 0 && <p className="card p-10 text-center text-gray-500">No products yet. Add some from the admin panel.</p>}
      </section>

      {/* HOW IT WORKS */}
      <section className="container-x pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Image src={LIFESTYLE_IMAGE} alt="Bright modern kitchen" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center gap-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur sm:right-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white"><PackageCheck className="h-6 w-6" /></div>
              <div>
                <p className="font-bold">Check first, pay later</p>
                <p className="text-sm text-gray-500">No advance payment needed</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Ordering is simple</h2>
            <ol className="mt-8 space-y-6">
              {[
                ["Choose your products", "Add items to your cart — watch the demo videos to see exactly how they work."],
                ["Place your order", "Enter your name, phone and address. No card or advance payment required."],
                ["We confirm & ship", "Our team calls to confirm, then dispatches within 24 hours with tracking."],
                ["Pay on delivery", "Receive your parcel and pay the rider in cash. Simple."],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500 font-extrabold text-white">{i + 1}</span>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-gray-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ + SUPPORT */}
      <section className="container-x pt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Questions?</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Frequently asked</h2>
            <p className="mt-3 text-gray-600">Can’t find your answer? Our team is happy to help.</p>
            <div className="mt-6 space-y-3">
              {STORE.whatsapp && (
                <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-[#25D366]/10 p-4 font-semibold text-[#128C7E] hover:bg-[#25D366]/15">
                  <Headphones className="h-5 w-5" /> Chat on WhatsApp
                </a>
              )}
              {STORE.phone && (
                <a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4 font-semibold text-brand-700 hover:bg-brand-100">
                  <Phone className="h-5 w-5" /> {STORE.phone}
                </a>
              )}
              <Link href="/contact" className="flex items-center gap-3 rounded-2xl bg-gray-100 p-4 font-semibold hover:bg-gray-200">
                <Star className="h-5 w-5" /> Contact support
              </Link>
            </div>
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pt-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-accent-500 to-amber-500 px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
          <h2 className="text-3xl font-extrabold sm:text-4xl">Order today. Pay on delivery.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">Free delivery on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}. No advance payment, ever.</p>
          <Link href="/shop" className="btn mt-8 bg-white px-8 py-4 text-base text-accent-600 shadow-lg hover:bg-accent-50">
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function SectionHead({ eyebrow, title, subtitle, link, dark }: { eyebrow?: string; title: string; subtitle?: string; link?: string; dark?: boolean }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className={`text-sm font-bold uppercase tracking-widest ${dark ? "text-accent-400" : "text-brand-600"}`}>{eyebrow}</p>}
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
        {subtitle && <p className={`mt-2 ${dark ? "text-white/60" : "text-gray-500"}`}>{subtitle}</p>}
      </div>
      {link && (
        <Link href={link} className="hidden items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:border-brand-300 hover:text-brand-700 sm:inline-flex">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
