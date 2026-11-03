import Image from "next/image";
import Link from "next/link";
import { BANK, STORE } from "@/lib/config";

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
          <div className="mt-8 flex gap-3">
            {STORE.instagram && (
              <a href={STORE.instagram} target="_blank" rel="noopener noreferrer" aria-label={`${STORE.name} on Instagram`} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              </a>
            )}
            {STORE.facebook && (
              <a href={STORE.facebook} target="_blank" rel="noopener noreferrer" aria-label={`${STORE.name} on Facebook`} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5H16.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" /></svg>
              </a>
            )}
            {STORE.tiktok && (
              <a href={STORE.tiktok} target="_blank" rel="noopener noreferrer" aria-label={`${STORE.name} on TikTok`} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z" /></svg>
              </a>
            )}
          </div>
        </div>
        <FooterCol title="Shop" links={[["All products", "/shop"], ["Kitchen appliances", "/category/kitchen-appliances"], ["Kitchen tools", "/category/kitchen-tools"], ["Sink organizers", "/category/kitchen-storage"], ["Home cleaning", "/category/home-cleaning"], ["Health & care", "/category/health-care"]]} />
        <FooterCol title="Help" links={[["Contact us", "/contact"], ["Shipping & returns", "/policies"], ["Your cart", "/cart"]]} />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[.24em] text-white">Get in touch</p>
          <ul className="mt-6 space-y-3 text-sm">
            {STORE.phone && <li>{STORE.phone}</li>}
            {STORE.email && <li>{STORE.email}</li>}
            <li>Delivering across Pakistan</li>
            <li>Mon – Sat, 10am – 8pm</li>
          </ul>
          <p className="mt-8 text-[11px] font-medium uppercase tracking-[.24em] text-white">We accept</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Cash on delivery</li>
            <li>
              Bank transfer ({BANK.bank}) —{" "}
              <span className="font-medium text-accent-400">{BANK.discountPct}% off + free delivery</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-7 text-[11px] uppercase tracking-[.2em] text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} {STORE.name}</p>
          <p className="text-center">Cash on delivery · Bank transfer {BANK.discountPct}% off · Secure checkout</p>
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
