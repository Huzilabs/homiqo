"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, PackageSearch, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { STORE, FREE_SHIPPING_THRESHOLD } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";

const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { count, setDrawerOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    track.search(term);
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand-900 px-4 py-2 text-center text-xs font-medium text-brand-50 sm:text-sm">
        Free delivery on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)} · Cash on Delivery all over Pakistan
      </div>
      <div className="border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="container-x flex h-16 items-center gap-4">
          <button className="-ml-2 p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-ink">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ShoppingBag className="h-[18px] w-[18px]" />
            </span>
            {STORE.name}
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href))
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <form onSubmit={submit} className="ml-auto hidden max-w-xs flex-1 lg:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:bg-white"
              />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <Link href="/track" className="hidden p-2 text-gray-600 hover:text-ink sm:block md:hidden" aria-label="Track order">
              <PackageSearch className="h-6 w-6" />
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative rounded-full p-2 text-gray-700 hover:bg-gray-100"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] animate-fade-in flex-col bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-lg font-extrabold">{STORE.name}</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={submit} className="mt-5">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products…"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm outline-none focus:border-brand-400"
                />
              </label>
            </form>
            <nav className="mt-4 flex flex-col">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 font-medium text-gray-700 hover:bg-gray-50"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
