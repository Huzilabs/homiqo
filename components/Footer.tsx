import Image from "next/image";
import Link from "next/link";
import { STORE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-32 bg-ink text-white/70">
      <div className="container-x grid gap-12 py-20 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Image src="/logo-white.png" alt={STORE.name} width={280} height={86} className="h-12 w-auto" />
          <p className="mt-6 max-w-xs font-serif text-xl leading-snug text-white/90">
            Thoughtful tools for the modern Pakistani kitchen.
          </p>
          {STORE.whatsapp && (
            <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-light mt-8">
              Chat on WhatsApp
            </a>
          )}
        </div>
        <FooterCol title="Shop" links={[["All products", "/shop"], ["Appliances", "/shop?category=Kitchen%20Appliances"], ["Kitchen tools", "/shop?category=Kitchen%20Tools"], ["Home cleaning", "/shop?category=Home%20Cleaning"]]} />
        <FooterCol title="Help" links={[["Contact us", "/contact"], ["Shipping & returns", "/policies"], ["Your cart", "/cart"]]} />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[.24em] text-white">Get in touch</p>
          <ul className="mt-6 space-y-3 text-sm">
            {STORE.phone && <li>{STORE.phone}</li>}
            {STORE.email && <li>{STORE.email}</li>}
            <li>Delivering across Pakistan</li>
            <li>Mon – Sat, 10am – 8pm</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-7 text-[11px] uppercase tracking-[.2em] text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} {STORE.name}</p>
          <p>Cash on delivery · Secure checkout</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[.24em] text-white">{title}</p>
      <ul className="mt-6 space-y-3 text-sm">
        {links.map(([label, href]) => (
          <li key={href}><Link href={href} className="transition hover:text-accent-400">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
