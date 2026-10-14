import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Banknote, Check, CookingPot, Headphones, Leaf, PackageCheck, Phone, RotateCcw, ShieldCheck, Sofa, Sparkles, Truck, UtensilsCrossed, Zap } from "lucide-react";
import Countdown from "@/components/Countdown";
import Faq from "@/components/Faq";
import InViewVideo from "@/components/InViewVideo";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import SetupNotice from "@/components/SetupNotice";
import VideoShowcase from "@/components/VideoShowcase";
import { getProducts } from "@/lib/products";
import { supabaseConfigured } from "@/lib/supabase/server";
import { discountPercent, formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, STORE } from "@/lib/config";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORY_ICON: Record<string, typeof Leaf> = {
  "Kitchen Appliances": CookingPot,
  "Kitchen Tools": UtensilsCrossed,
  "Kitchen Storage": Sofa,
  "Home Cleaning": Sparkles,
};

const faqs = [
  { q: "How does Cash on Delivery work?", a: "Place your order online without paying anything. Our rider delivers to your door and you pay in cash after receiving the parcel." },
  { q: "How long does delivery take?", a: "Most orders arrive within 2–5 working days anywhere in Pakistan. Karachi, Lahore and Islamabad are usually faster." },
  { q: "How much is delivery?", a: `Delivery is ${formatPrice(SHIPPING_FEE)} per order, and free on orders of ${formatPrice(FREE_SHIPPING_THRESHOLD)} or more.` },
  { q: "Will I get a confirmation?", a: "Yes — you’ll receive an email as soon as your order is placed, another when we confirm it, and one more when it ships." },
  { q: "What if the product is damaged or not working?", a: "Contact us within 7 days of delivery and we’ll replace it or refund you. Please keep the original packaging." },
];

export default async function HomePage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const products = await getProducts();
  if (products.length === 0) return <div className="container-x py-24 text-center text-gray-500">No products yet — add some from the admin panel.</div>;

  const featured = products.filter((p) => p.is_featured);
  const best = (featured.length >= 4 ? featured : products).slice(0, 4);
  const spotlight = products.find((p) => p.slug.includes("qeema")) || products.find((p) => p.videos.length) || products[0];
  const heroSide = products.filter((p) => p.id !== spotlight.id && p.is_featured).slice(0, 2);
  const deal = [...products].filter((p) => p.stock > 0 && p.id !== spotlight.id).sort((a, b) => discountPercent(b.price, b.compare_at_price) - discountPercent(a.price, a.compare_at_price))[0];
  const reels = products.filter((p) => p.videos.length > 0).slice(0, 4);
  const categories = Array.from(new Set(products.map((p) => p.category))).map((c) => ({
    name: c,
    image: products.find((p) => p.category === c)?.images[0],
    count: products.filter((p) => p.category === c).length,
  }));

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="container-x pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-[36px] bg-cream px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <LeafShape className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 rotate-12 text-accent-500/15" />
          <LeafShape className="pointer-events-none absolute -bottom-16 left-1/3 h-44 w-44 -rotate-45 text-leaf-500/15" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-700 shadow-card">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-white"><Zap className="h-3 w-3" /></span>
                New season sale — up to 40% off
              </span>
              <h1 className="h-display mt-6 text-brand-700">
                Smart tools for a <span className="relative whitespace-nowrap text-accent-500">happier<Squiggle className="absolute -bottom-2 left-0 w-full text-accent-500/40" /></span> home.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/70 sm:text-lg">
                Qeema makers, choppers, coffee makers &amp; cordless vacuums — demo-tested and delivered anywhere in Pakistan. Pay only when it arrives.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className="btn-primary px-8 py-4 text-base">
                  Shop collection <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#reels" className="btn-secondary px-7 py-4 text-base">Watch demos</a>
              </div>
              <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
                {[
                  { icon: Banknote, t: "Cash on", b: "Delivery" },
                  { icon: Truck, t: "2–5 day", b: "Delivery" },
                  { icon: RotateCcw, t: "7-day", b: "Returns" },
                ].map(({ icon: Icon, t, b }) => (
                  <div key={t + b} className="rounded-2xl bg-white/70 p-3 text-center ring-1 ring-white">
                    <Icon className="mx-auto h-5 w-5 text-accent-500" />
                    <p className="mt-1.5 text-[11px] leading-tight text-ink/60">{t}</p>
                    <p className="text-xs font-bold text-brand-700">{b}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-5 grid-rows-2 gap-3 sm:gap-4 lg:h-[520px]">
              <Link href={`/product/${spotlight.slug}`} className="group relative col-span-5 row-span-2 aspect-[4/3] overflow-hidden rounded-[28px] bg-brand-800 shadow-lift sm:col-span-3 sm:aspect-auto">
                <ProductImage src={spotlight.images[0]} alt={spotlight.name} priority sizes="(max-width:1024px) 100vw, 35vw" />
                <InViewVideo url={spotlight.videos[0]} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/80 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-brand-700 backdrop-blur">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live demo
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent-400">Best seller</p>
                    <p className="mt-1 text-lg font-bold leading-tight">{spotlight.name}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent-500 px-4 py-2 text-sm font-bold shadow-glow">{formatPrice(spotlight.price)}</span>
                </div>
              </Link>
              {heroSide.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`} className="group relative col-span-2 hidden overflow-hidden rounded-[28px] bg-white shadow-card sm:block">
                  <ProductImage src={p.images[0]} alt={p.name} sizes="20vw" className="transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-2 bottom-2 rounded-2xl bg-white/95 p-3 backdrop-blur">
                    <p className="line-clamp-1 text-xs font-semibold">{p.name}</p>
                    <p className="text-sm font-bold text-brand-600">{formatPrice(p.price)}</p>
                  </div>
                  {discountPercent(p.price, p.compare_at_price) > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-accent-500 px-2 py-1 text-[10px] font-bold text-white">-{discountPercent(p.price, p.compare_at_price)}%</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── CATEGORIES ───────────── */}
      <section className="container-x pt-16">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
          {categories.map((c) => {
            const Icon = CATEGORY_ICON[c.name] || Leaf;
            return (
              <Link key={c.name} href={`/shop?category=${encodeURIComponent(c.name)}`} className="group flex w-28 flex-col items-center text-center sm:w-32">
                <span className="relative h-24 w-24 overflow-hidden rounded-full bg-accent-50 ring-4 ring-white shadow-card transition duration-300 group-hover:-translate-y-1 group-hover:ring-accent-200 sm:h-28 sm:w-28">
                  <ProductImage src={c.image} alt={c.name} sizes="112px" className="transition duration-500 group-hover:scale-110" />
                  <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white ring-2 ring-white">
                    <Icon className="h-4 w-4" />
                  </span>
                </span>
                <span className="mt-3 text-sm font-semibold text-brand-700">{c.name}</span>
                <span className="text-xs text-ink/50">{c.count} item{c.count === 1 ? "" : "s"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────────── BEST SELLERS ───────────── */}
      <section className="container-x pt-20">
        <Head eyebrow="Customer favourites" title="Best sellers" text="Hover any product to watch it in action." link="/shop" />
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {best.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
        </div>
      </section>

      {/* ───────────── SPOTLIGHT ───────────── */}
      <Spotlight product={spotlight} />

      {/* ───────────── REELS ───────────── */}
      {reels.length > 0 && (
        <section id="reels" className="mt-24 scroll-mt-24 bg-brand-700 py-20 text-white">
          <div className="container-x">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="eyebrow text-accent-400">See it before you buy</span>
                <h2 className="h-section mt-2">Watch &amp; shop</h2>
                <p className="mt-2 text-brand-100">Hover a video to play it — real product demos.</p>
              </div>
              <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/20">
                All products <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <VideoShowcase products={reels} />
          </div>
        </section>
      )}

      {/* ───────────── ALL PRODUCTS ───────────── */}
      <section className="container-x pt-24">
        <Head eyebrow="The full range" title="Everything for your kitchen" link="/shop" />
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ───────────── DEAL ───────────── */}
      {deal && (
        <section className="container-x pt-24">
          <div className="grid overflow-hidden rounded-[36px] bg-accent-500 text-white lg:grid-cols-2">
            <div className="relative order-2 p-8 sm:p-12 lg:order-1">
              <LeafShape className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 text-white/10" />
              <span className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-600">Deal of the day</span>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">{deal.name}</h2>
              <p className="mt-3 max-w-md text-white/90">{deal.short_description}</p>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-5xl font-extrabold">{formatPrice(deal.price)}</span>
                {deal.compare_at_price && <span className="text-xl text-white/70 line-through">{formatPrice(deal.compare_at_price)}</span>}
              </div>
              <p className="mb-3 mt-8 text-sm font-medium text-white/85">Hurry — offer ends in</p>
              <Countdown />
              <Link href={`/product/${deal.slug}`} className="btn mt-8 bg-brand-700 px-8 py-4 text-base text-white hover:bg-brand-800">
                Grab the deal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative order-1 min-h-[280px] lg:order-2">
              <ProductImage src={deal.images[0]} alt={deal.name} sizes="(max-width:1024px) 100vw, 50vw" />
              <span className="absolute right-6 top-6 flex h-24 w-24 rotate-12 flex-col items-center justify-center rounded-full bg-brand-700 text-center font-extrabold shadow-xl">
                <span className="text-2xl leading-none">{discountPercent(deal.price, deal.compare_at_price)}%</span>
                <span className="text-xs">OFF</span>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="container-x pt-24">
        <div className="text-center">
          <span className="eyebrow">Simple &amp; safe</span>
          <h2 className="h-section mt-2 text-brand-700">Order now, pay at your door</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: PackageCheck, t: "Pick your products", d: "Watch the demos and add what you love to your cart." },
            { icon: Check, t: "Place your order", d: "Just your name, phone & address. No card needed." },
            { icon: Truck, t: "We confirm & ship", d: "You get an email confirmation, then we dispatch within 24h." },
            { icon: Banknote, t: "Pay on delivery", d: "Receive your parcel, check it, then pay the rider." },
          ].map(({ icon: Icon, t, d }, i) => (
            <div key={t} className="relative rounded-[28px] bg-white p-7 shadow-card ring-1 ring-brand-50">
              <span className="absolute right-6 top-5 text-5xl font-extrabold text-brand-50">0{i + 1}</span>
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-500"><Icon className="h-7 w-7" /></span>
              <p className="relative mt-5 text-lg font-bold text-brand-700">{t}</p>
              <p className="relative mt-1.5 text-sm leading-relaxed text-ink/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="container-x pt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="eyebrow">Need help?</span>
            <h2 className="h-section mt-2 text-brand-700">Questions, answered</h2>
            <p className="mt-3 text-ink/60">Still unsure? Our team replies fast.</p>
            <div className="mt-6 space-y-3">
              {STORE.whatsapp && (
                <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-white p-4 font-semibold text-[#128C7E] shadow-card hover:ring-1 hover:ring-[#25D366]">
                  <Headphones className="h-5 w-5" /> Chat on WhatsApp
                </a>
              )}
              {STORE.phone && (
                <a href={`tel:${STORE.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-semibold text-brand-700 shadow-card">
                  <Phone className="h-5 w-5" /> {STORE.phone}
                </a>
              )}
              <Link href="/contact" className="flex items-center gap-3 rounded-2xl bg-brand-600 p-4 font-semibold text-white hover:bg-brand-700">
                <ShieldCheck className="h-5 w-5" /> Contact support
              </Link>
            </div>
          </div>
          <Faq items={faqs} />
        </div>
      </section>
    </>
  );
}

function Spotlight({ product }: { product: Product }) {
  const off = discountPercent(product.price, product.compare_at_price);
  return (
    <section className="container-x pt-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-brand-800 shadow-lift sm:aspect-[5/4] lg:aspect-[4/5]">
            <ProductImage src={product.images[1] || product.images[0]} alt={product.name} sizes="(max-width:1024px) 100vw, 50vw" />
            <InViewVideo url={product.videos[1] || product.videos[0]} />
          </div>
          <div className="absolute -bottom-6 -right-2 hidden animate-float rounded-3xl bg-white p-5 shadow-lift sm:block lg:-right-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">Only</p>
            <p className="text-3xl font-extrabold text-brand-600">{formatPrice(product.price)}</p>
            {off > 0 && <p className="text-sm font-semibold text-accent-600">Save {off}% today</p>}
          </div>
        </div>
        <div>
          <span className="eyebrow">Product spotlight</span>
          <h2 className="h-section mt-2 text-brand-700">{product.name}</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/70">{product.description || product.short_description}</p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {product.features.slice(0, 6).map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-2xl bg-white p-3.5 text-sm font-medium shadow-card ring-1 ring-brand-50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-600"><Check className="h-3.5 w-3.5" /></span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/product/${product.slug}`} className="btn-accent px-8 py-4 text-base">
              Shop now — {formatPrice(product.price)}
            </Link>
            <Link href={`/product/${product.slug}`} className="btn-secondary px-7 py-4 text-base">View details</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Head({ eyebrow, title, text, link }: { eyebrow: string; title: string; text?: string; link?: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-4">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="h-section mt-2 text-brand-700">{title}</h2>
        {text && <p className="mt-2 text-ink/60">{text}</p>}
      </div>
      {link && (
        <Link href={link} className="group hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-card ring-1 ring-brand-50 hover:ring-brand-200 sm:inline-flex">
          View all <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function LeafShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor" aria-hidden>
      <path d="M90 8C50 6 14 26 10 66c-1 10 2 20 6 26 6-22 22-44 48-56-22 16-36 36-42 58 36 6 68-20 72-58 1-10-1-20-4-28Z" />
    </svg>
  );
}

function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 12" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M2 8c30-6 60-6 98 0s70 6 98 0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
