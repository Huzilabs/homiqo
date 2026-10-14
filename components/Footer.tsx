import Image from "next/image";
import Link from "next/link";
import { Banknote, Mail, MapPin, MessageCircle, Phone, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { STORE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-28 bg-brand-900 text-brand-100">
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
          {[
            { icon: Banknote, t: "Cash on Delivery", d: "Pay at your doorstep" },
            { icon: Truck, t: "Fast delivery", d: "2–5 days nationwide" },
            { icon: RotateCcw, t: "Easy returns", d: "7-day replacement" },
            { icon: ShieldCheck, t: "Quality checked", d: "Every item tested" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-accent-400"><Icon className="h-5 w-5" /></span>
              <span>
                <span className="block text-sm font-semibold text-white">{t}</span>
                <span className="text-xs text-brand-200">{d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Image src="/logo-white.png" alt={STORE.name} width={280} height={86} className="h-11 w-auto" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-200">
            Smart kitchen &amp; home essentials that make everyday life easier. Delivered to your door, anywhere in Pakistan.
          </p>
          {STORE.whatsapp && (
            <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/shop" className="hover:text-accent-400">All products</Link></li>
            <li><Link href="/shop?category=Kitchen%20Appliances" className="hover:text-accent-400">Kitchen appliances</Link></li>
            <li><Link href="/shop?category=Kitchen%20Tools" className="hover:text-accent-400">Kitchen tools</Link></li>
            <li><Link href="/shop?category=Home%20Cleaning" className="hover:text-accent-400">Home cleaning</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white">Help</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/contact" className="hover:text-accent-400">Contact us</Link></li>
            <li><Link href="/policies" className="hover:text-accent-400">Shipping &amp; returns</Link></li>
            <li><Link href="/cart" className="hover:text-accent-400">Your cart</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white">Get in touch</p>
          <ul className="mt-4 space-y-3 text-sm">
            {STORE.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent-400" /> {STORE.phone}</li>}
            {STORE.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent-400" /> {STORE.email}</li>}
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent-400" /> Delivering across Pakistan</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-brand-300 sm:flex-row">
          <p>© {new Date().getFullYear()} {STORE.name}. All rights reserved.</p>
          <p>Secure checkout · Cash on Delivery</p>
        </div>
      </div>
    </footer>
  );
}
