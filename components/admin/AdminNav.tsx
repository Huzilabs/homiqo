"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LayoutDashboard, LogOut, Megaphone, Menu, Package, ShoppingCart, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { STORE } from "@/lib/config";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
];

export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-brand-600 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5" /> {label}
          </Link>
        );
      })}
      <Link href="/" target="_blank" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white">
        <ExternalLink className="h-5 w-5" /> View store
      </Link>
      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="truncate px-3 text-xs text-gray-400">{email}</p>
        <button onClick={signOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white">
          <LogOut className="h-5 w-5" /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <span className="font-extrabold">{STORE.name} Admin</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink p-4">
            <div className="mb-6 flex items-center justify-between text-white">
              <span className="font-extrabold">{STORE.name} Admin</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-6 w-6" /></button>
            </div>
            {nav}
          </aside>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-ink p-4 lg:flex">
        <p className="mb-8 px-3 pt-2 text-lg font-extrabold text-white">{STORE.name} <span className="text-brand-400">Admin</span></p>
        {nav}
      </aside>
    </>
  );
}
