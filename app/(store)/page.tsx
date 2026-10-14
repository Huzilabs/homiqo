import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Banknote, PackageCheck, RotateCcw, Truck } from "lucide-react";
import Countdown from "@/components/Countdown";
import Faq from "@/components/Faq";
import InViewVideo from "@/components/InViewVideo";
import ProductCard from "@/components/ProductCard";
import ProductImage from "@/components/ProductImage";
import SetupNotice from "@/components/SetupNotice";
import VideoShowcase from "@/components/VideoShowcase";
import { getProducts } from "@/lib/products";
import { supabaseConfigured } from "@/lib/supabase/server";
import { discountPercent, formatPrice, previewVideo } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, STORE } from "@/lib/config";
import { LIFESTYLE_IMAGE } from "@/lib/media";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const faqs = [
  { q: "How does Cash on Delivery work?", a: "Place your order online without paying anything. Our rider delivers to your door and you pay in cash after receiving the parcel." },
  { q: "How long does delivery take?", a: "Most orders arrive within 2–5 working days anywhere in Pakistan. Karachi, Lahore and Islamabad are usually faster." },
  { q: "How much is delivery?", a: `Delivery is ${formatPrice(SHIPPING_FEE)} per order, and complimentary on orders of ${formatPrice(FREE_SHIPPING_THRESHOLD)} or more.` },
  { q: "Will I receive a confirmation?", a: "Yes — an email as soon as your order is placed, another when we confirm it, and one more when it ships." },
  { q: "What if something arrives damaged?", a: "Write to us within 7 days of delivery and we’ll replace it or refund you. Please keep the original packaging." },
];

export default async function HomePage() {
  if (!supabaseConfigured) return <SetupNotice />;
  const products = await getProducts();
  if (products.length === 0) return <div className="container-x py-32 text-center font-serif text-3xl text-ink/50">The collection is being prepared.</div>;

  const featured = products.filter((p) => p.is_featured);
  const edit = [...featured, ...products.filter((p) => !p.is_featured)].slice(0, 4);
  const hero = products.find((p) => p.slug.includes("qeema")) || featured[0] || products[0];
  const spotlight = products.find((p) => p.slug.includes("vacuum") && p.id !== hero.id) || featured.find((p) => p.id !== hero.id) || products[0];
  const deal = [...products].filter((p) => p.stock > 0 && p.id !== hero.id && p.id !== spotlight.id).sort((a, b) => discountPercent(b.price, b.compare_at_price) - discountPercent(a.price, a.compare_at_price))[0];
  const reels = products.filter((p) => previewVideo(p.videos)).slice(0, 4);
  const categories = Array.from(new Set(products.map((p) => p.category))).map((c) => ({
    name: c,
    image: products.find((p) => p.category === c)?.images[0],
    count: products.filter((p) => p.category === c).length,
  }));

  return (
    <>
      {/* ═════════ HERO — full-screen editorial split ═════════ */}
      <section className="grid lg:h-[calc(100svh-113px)] lg:min-h-[640px] lg:grid-cols-2">
        <div className="relative order-2 flex items-center bg-sand px-6 py-16 sm:px-12 lg:order-1 lg:px-[max(3rem,calc((100vw-1320px)/2+3rem))] lg:py-0">
          <div className="max-w-[560px] animate-fade-in">
            <p className="eyebrow">The Homiqo Kitchen Edit</p>
            <h1 className="h-display mt-6 text-ink">
              Clever tools for the <em className="font-serif italic text-brand-600">heart</em> of your home
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-ink/65 sm:text-[17px]">
              Qeema makers, choppers, coffee makers and cordless vacuums — tested in real kitchens, delivered anywhere in Pakistan. Pay only when it arrives.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/shop" className="btn-primary">Shop now</Link>
              <a href="#watch" className="link-arrow">Watch it in action <ArrowRight className="h-3.5 w-3.5" /></a>
            </div>
            <div className="mt-14 hidden grid-cols-3 border-t border-ink/10 pt-8 sm:grid">
              {[
                ["Cash on", "delivery"],
                ["2–5 day", "delivery"],
                ["7-day", "returns"],
              ].map(([a, b]) => (
                <p key={a} className="text-[11px] uppercase leading-relaxed tracking-[.2em] text-ink/55">
                  <span className="block font-serif text-2xl normal-case tracking-normal text-ink">{a}</span>
                  {b}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="relative order-1 aspect-[4/5] overflow-hidden bg-brand-900 sm:aspect-[16/11] lg:order-2 lg:aspect-auto">
          <ProductImage src={hero.images[0]} alt={hero.name} priority sizes="(max-width:1024px) 100vw, 50vw" />
          <InViewVideo url={previewVideo(hero.videos)} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
          <Link
            href={`/product/${hero.slug}`}
            className="group absolute bottom-5 left-5 right-5 flex items-center gap-4 bg-paper/95 p-3 pr-5 backdrop-blur transition hover:bg-white sm:bottom-8 sm:left-8 sm:right-auto"
          >
            <span className="relative h-16 w-16 shrink-0 overflow-hidden bg-sand">
              <ProductImage src={hero.images[1] || hero.images[0]} alt="" sizes="64px" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-[.2em] text-accent-600">Now playing</span>
              <span className="block truncate font-serif text-lg text-ink">{hero.name}</span>
              <span className="text-sm text-ink/60">{formatPrice(hero.price)}</span>
            </span>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ═════════ CATEGORIES ═════════ */}
      <section className="container-x pt-24 sm:pt-28">
        <div className="text-center">
          <p className="eyebrow">Shop by room &amp; ritual</p>
          <h2 className="h-section mt-4">Find your essentials</h2>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.name} href={`/shop?category=${encodeURIComponent(c.name)}`} className="group flex flex-col items-center text-center">
              <span className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-full bg-sand">
                <ProductImage src={c.image} alt={c.name} sizes="240px" className="transition duration-[1.2s] group-hover:scale-110" />
              </span>
              <span className="mt-6 font-serif text-2xl text-ink transition group-hover:text-brand-600">{c.name}</span>
              <span className="mt-1 text-[11px] uppercase tracking-[.2em] text-ink/45">{c.count} {c.count === 1 ? "piece" : "pieces"}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═════════ FEATURED EDIT ═════════ */}
      <section className="container-x pt-28 sm:pt-36">
        <SectionHead eyebrow="Featured collection" title="The Bestseller Edit" href="/shop" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-7 lg:grid-cols-4">
          {edit.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
        </div>
      </section>

      {/* ═════════ SPOTLIGHT — editorial split ═════════ */}
      <Spotlight product={spotlight} />

      {/* ═════════ PROMISES ═════════ */}
      <section className="container-x pt-28">
        <div className="grid grid-cols-2 border-y border-ink/10 lg:grid-cols-4">
          {[
            { icon: Banknote, t: "Cash on delivery", d: "Pay at your doorstep" },
            { icon: Truck, t: "Delivered in 2–5 days", d: `Free over ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
            { icon: RotateCcw, t: "7-day returns", d: "Simple replacements" },
            { icon: PackageCheck, t: "Quality checked", d: "Tested before dispatch" },
          ].map(({ icon: Icon, t, d }, i) => (
            <div key={t} className={`flex flex-col items-center px-4 py-10 text-center ${i % 2 ? "border-l border-ink/10" : ""} ${i === 2 ? "max-lg:border-t lg:border-l" : ""} ${i === 3 ? "max-lg:border-t" : ""}`}>
              <Icon className="h-7 w-7 text-brand-600" strokeWidth={1.25} />
              <p className="mt-4 font-serif text-xl text-ink">{t}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[.18em] text-ink/50">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═════════ WATCH & SHOP ═════════ */}
      {reels.length > 0 && (
        <section id="watch" className="mt-28 scroll-mt-28 bg-ink py-24 text-white sm:mt-36 sm:py-28">
          <div className="container-x">
            <div className="mb-14 grid items-end gap-6 lg:grid-cols-2">
              <div>
                <p className="eyebrow text-accent-400">See before you buy</p>
                <h2 className="h-section mt-4">Watch &amp; shop</h2>
              </div>
              <p className="max-w-md text-[15px] leading-relaxed text-white/60 lg:justify-self-end">
                Hover over a film to see each product at work. Want the full review? Watch it on YouTube.
              </p>
            </div>
            <VideoShowcase products={reels} />
          </div>
        </section>
      )}

      {/* ═════════ DEAL OF THE DAY ═════════ */}
      {deal && (
        <section className="container-x pt-28 sm:pt-36">
          <div className="grid bg-sand lg:grid-cols-2">
            <Link href={`/product/${deal.slug}`} className="group relative block aspect-square overflow-hidden lg:aspect-auto lg:min-h-[600px]">
              <ProductImage src={deal.images[0]} alt={deal.name} sizes="(max-width:1024px) 100vw, 50vw" className="transition duration-[1.2s] group-hover:scale-[1.03]" />
              <span className="absolute left-5 top-5 bg-accent-600 px-3 py-1.5 text-[11px] font-medium tracking-[.14em] text-white">
                −{discountPercent(deal.price, deal.compare_at_price)}% TODAY
              </span>
            </Link>
            <div className="flex flex-col justify-center px-6 py-14 sm:px-14 lg:px-20">
              <p className="eyebrow">Deal of the day</p>
              <h2 className="h-section mt-4">{deal.name}</h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/65">{deal.short_description}</p>
              <p className="mt-8 flex items-baseline gap-4">
                <span className="font-serif text-5xl text-accent-700">{formatPrice(deal.price)}</span>
                {deal.compare_at_price && <span className="text-lg text-ink/40 line-through">{formatPrice(deal.compare_at_price)}</span>}
              </p>
              <p className="mb-4 mt-10 text-[11px] uppercase tracking-[.22em] text-ink/50">Offer ends in</p>
              <Countdown />
              <div className="mt-10"><Link href={`/product/${deal.slug}`} className="btn-primary">Shop the deal</Link></div>
            </div>
          </div>
        </section>
      )}

      {/* ═════════ FULL RANGE ═════════ */}
      <section className="container-x pt-28 sm:pt-36">
        <SectionHead eyebrow="The full range" title="Everything for the kitchen" href="/shop" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-7 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ═════════ HOW IT WORKS ═════════ */}
      <section className="container-x pt-28 sm:pt-36">
        <div className="grid gap-14 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Simple &amp; safe</p>
            <h2 className="h-section mt-4">Order today, pay at your door</h2>
          </div>
          <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {[
              ["Choose", "Watch the films and add what you love to your cart."],
              ["Place your order", "Just your name, phone, email and address — no card needed."],
              ["We confirm & ship", "You’ll get an email confirmation, then we dispatch within 24 hours."],
              ["Pay on delivery", "Receive your parcel, check it, then pay the rider in cash."],
            ].map(([t, d], i) => (
              <li key={t} className="border-t border-ink/15 pt-6">
                <span className="font-serif text-5xl italic text-accent-500">0{i + 1}</span>
                <p className="mt-4 font-serif text-2xl text-ink">{t}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/60">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═════════ FAQ ═════════ */}
      <section className="container-x pt-28 sm:pt-36">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="h-section mt-4">Good to know</h2>
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-ink/60">Can’t find what you’re looking for? Our team usually replies within the hour.</p>
            <div className="mt-8 flex flex-col items-start gap-4">
              {STORE.whatsapp && <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-primary">WhatsApp us</a>}
              <Link href="/contact" className="link-arrow">Contact support <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      {/* ═════════ CLOSING BANNER ═════════ */}
      <section className="relative mt-28 overflow-hidden sm:mt-36">
        <Image src={LIFESTYLE_IMAGE} alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="container-x relative flex min-h-[520px] flex-col items-center justify-center py-24 text-center text-white">
          <p className="eyebrow text-accent-400">No advance payment, ever</p>
          <h2 className="h-display mt-6 max-w-3xl">A smarter kitchen is one click away</h2>
          <Link href="/shop" className="btn-light mt-10">Explore the collection</Link>
        </div>
      </section>
    </>
  );
}

function Spotlight({ product }: { product: Product }) {
  const off = discountPercent(product.price, product.compare_at_price);
  return (
    <section className="pt-28 sm:pt-36">
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-brand-900 sm:aspect-[16/12] lg:aspect-auto lg:min-h-[720px]">
          <ProductImage src={product.images[0]} alt={product.name} sizes="(max-width:1024px) 100vw, 50vw" />
          <InViewVideo url={previewVideo(product.videos)} />
        </div>
        <div className="flex items-center bg-brand-600 px-6 py-16 text-white sm:px-14 lg:px-20">
          <div className="max-w-lg">
            <p className="eyebrow text-accent-400">In the spotlight</p>
            <h2 className="h-section mt-4">{product.name}</h2>
            <p className="mt-6 text-[15px] leading-relaxed text-white/75">{product.description || product.short_description}</p>
            <ul className="mt-8 border-t border-white/15">
              {product.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-center gap-4 border-b border-white/15 py-4 text-sm text-white/90">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <span className="font-serif text-4xl">{formatPrice(product.price)}</span>
              {off > 0 && <span className="text-[11px] uppercase tracking-[.2em] text-accent-400">Save {off}%</span>}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={`/product/${product.slug}`} className="btn-light">Discover</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="mb-12 flex items-end justify-between gap-6">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h-section mt-4">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="link-arrow shrink-0 pb-2">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
