"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { FREE_SHIPPING_THRESHOLD, STORE } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";

const nav = [
  { href: "/shop", label: "Shop all", match: (p: string, c: string | null) => p === "/shop" && !c },
  { href: "/shop?category=Kitchen%20Appliances", label: "Appliances", match: (p: string, c: string | null) => c === "Kitchen Appliances" },
  { href: "/shop?category=Kitchen%20Tools", label: "Kitchen tools", match: (p: string, c: string | null) => c === "Kitchen Tools" },
  { href: "/shop?category=Home%20Cleaning", label: "Cleaning", match: (p: string, c: string | null) => c === "Home Cleaning" },
  { href: "/contact", label: "Contact", match: (p: string) => p === "/contact" },
];

function NavLinks({ onClick, mobile }: { onClick?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  const cat = useSearchParams().get("category");
  return (
    <>
      {nav.filter((n) => mobile || n.href !== "/contact").map((n) => {
        const active = n.match(pathname, cat);
        return mobile ? (
          <Link key={n.href} href={n.href} onClick={onClick} className="border-b border-ink/10 py-4 font-serif text-3xl text-ink">
            {n.label}
          </Link>
        ) : (
          <Link
            key={n.href}
            href={n.href}
            className={`relative whitespace-nowrap py-2 text-[11px] font-medium uppercase tracking-[.2em] transition hover:text-brand-600 ${active ? "text-brand-600" : "text-ink/80"}`}
          >
            {n.label}
            <span className={`absolute -bottom-0.5 left-0 h-px bg-brand-600 transition-all ${active ? "w-full" : "w-0"}`} />
          </Link>
        );
      })}
    </>
  );
}

export default function Header() {
  const { count, setDrawerOpen } = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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
      <div className="bg-ink px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-[.22em] text-white/85">
        Free delivery over {formatPrice(FREE_SHIPPING_THRESHOLD)} <span className="mx-3 text-accent-400">·</span> Cash on delivery across Pakistan
      </div>

      <header className={`sticky top-0 z-40 border-b transition-colors duration-300 ${scrolled ? "border-ink/10 bg-paper/95 backdrop-blur" : "border-ink/5 bg-paper"}`}>
        <div className="container-x grid h-[76px] grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center gap-8">
            <button className="-ml-1 p-1 xl:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <nav className="hidden items-center gap-7 xl:flex">
              <Suspense>
                <NavLinks />
              </Suspense>
            </nav>
          </div>

          <Link href="/" aria-label={`${STORE.name} home`} className="justify-self-center">
            <Image src="/logo.png" alt={STORE.name} width={357} height={97} priority className="h-9 w-auto sm:h-11" />
          </Link>

          <div className="flex items-center justify-end gap-2 sm:gap-4">
            <button onClick={() => setSearchOpen((v) => !v)} className="p-2 text-ink transition hover:text-brand-600" aria-label="Search">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button onClick={() => setDrawerOpen(true)} className="relative p-2 text-ink transition hover:text-brand-600" aria-label={`Open cart, ${count} items`}>
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-ink/10 bg-paper">
            <form onSubmit={submit} className="container-x flex items-center gap-4 py-6">
              <Search className="h-6 w-6 text-ink/40" strokeWidth={1.5} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for choppers, coffee makers, vacuums…"
                className="w-full bg-transparent font-serif text-2xl text-ink outline-none placeholder:text-ink/30 sm:text-3xl"
              />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search" className="p-1">
                <X className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </form>
          </div>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-fade-in flex-col bg-paper px-7 py-6">
            <div className="flex items-center justify-between">
              <Image src="/logo.png" alt={STORE.name} width={357} height={97} className="h-9 w-auto" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1">
                <X className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={submit} className="mt-8">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="input" />
            </form>
            <nav className="mt-6 flex flex-col">
              <Link href="/" onClick={() => setOpen(false)} className="border-b border-ink/10 py-4 font-serif text-3xl text-ink">Home</Link>
              <Suspense>
                <NavLinks mobile onClick={() => setOpen(false)} />
              </Suspense>
            </nav>
            <p className="mt-auto text-[11px] uppercase tracking-[.2em] text-ink/50">Cash on delivery · 7-day returns</p>
          </div>
        </div>
      )}
    </>
  );
}
