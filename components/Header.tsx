"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, Leaf, Menu, RotateCcw, Search, ShoppingBag, Truck, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD, STORE } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";

const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=Kitchen%20Appliances", label: "Appliances" },
  { href: "/shop?category=Kitchen%20Tools", label: "Kitchen tools" },
  { href: "/contact", label: "Contact" },
];

const announcements = [
  { icon: Truck, text: `Free delivery on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
  { icon: Banknote, text: "Cash on Delivery all over Pakistan" },
  { icon: RotateCcw, text: "7-day easy returns" },
  { icon: Leaf, text: "Quality checked before dispatch" },
];

export default function Header() {
  const { count, setDrawerOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    track.search(term);
    setOpen(false);
    setSearchOpen(false);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <div className="overflow-hidden bg-brand-900 py-2.5 text-xs font-medium text-brand-50">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
          {[...announcements, ...announcements, ...announcements, ...announcements].map(({ icon: Icon, text }, i) => (
            <span key={i} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-accent-400" /> {text}
            </span>
          ))}
        </div>
      </div>

      <header className={`sticky top-0 z-40 transition-all ${scrolled ? "bg-white/90 shadow-[0_1px_0_rgba(13,91,88,.08)] backdrop-blur-lg" : "bg-[#FFFAF3]"}`}>
        <div className="container-x flex h-[72px] items-center gap-4">
          <button className="-ml-2 rounded-full p-2 hover:bg-brand-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="shrink-0" aria-label={`${STORE.name} home`}>
            <Image src="/logo.png" alt={STORE.name} width={357} height={97} priority className="h-9 w-auto sm:h-10" />
          </Link>

          <nav className="mx-auto hidden items-center gap-1 lg:flex">
            {nav.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href.split("?")[0]) && n.href === "/shop";
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${active ? "text-brand-600" : "text-ink/70 hover:text-brand-600"}`}
                >
                  {n.label}
                  {active && <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-accent-500" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <button onClick={() => setSearchOpen((v) => !v)} className="rounded-full p-2.5 text-ink/80 hover:bg-brand-50 hover:text-brand-600" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-full bg-brand-600 py-2 pl-3 pr-4 text-sm font-semibold text-white transition hover:bg-brand-700"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Cart</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold">{count}</span>
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-brand-50 bg-white">
            <form onSubmit={submit} className="container-x py-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search choppers, coffee makers, vacuums…"
                  className="h-14 w-full rounded-full border border-brand-100 bg-cream/60 pl-12 pr-4 text-base outline-none focus:border-brand-400 focus:bg-white"
                />
              </label>
            </form>
          </div>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] animate-fade-in flex-col bg-[#FFFAF3] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <Image src="/logo.png" alt={STORE.name} width={357} height={97} className="h-9 w-auto" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-full p-1.5 hover:bg-brand-50">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={submit} className="mt-6">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="input rounded-full" />
            </form>
            <nav className="mt-6 flex flex-col gap-1">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-lg font-semibold text-ink hover:bg-brand-50">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto rounded-3xl bg-brand-600 p-5 text-white">
              <p className="font-semibold">Cash on Delivery</p>
              <p className="mt-1 text-sm text-brand-100">Pay only when your order arrives.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
