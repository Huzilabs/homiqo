import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { STORE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-gray-300">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-extrabold text-white">{STORE.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">{STORE.tagline}. Cash on delivery nationwide.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-white">All products</Link></li>
            <li><Link href="/shop?category=Kitchen%20Appliances" className="hover:text-white">Kitchen appliances</Link></li>
            <li><Link href="/shop?category=Kitchen%20Tools" className="hover:text-white">Kitchen tools</Link></li>
            <li><Link href="/shop?category=Home%20Cleaning" className="hover:text-white">Home cleaning</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Help</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/track" className="hover:text-white">Track your order</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact us</Link></li>
            <li><Link href="/policies" className="hover:text-white">Shipping & returns</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Get in touch</p>
          <ul className="mt-3 space-y-2 text-sm">
            {STORE.phone && (
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {STORE.phone}</li>
            )}
            {STORE.email && (
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {STORE.email}</li>
            )}
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivering across Pakistan</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {STORE.name}. All rights reserved.</p>
          <p>Secure checkout · Cash on Delivery</p>
        </div>
      </div>
    </footer>
  );
}
