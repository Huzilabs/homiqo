import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { STORE } from "@/lib/config";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  const items = [
    STORE.phone && { icon: Phone, label: "Call us", value: STORE.phone, href: `tel:${STORE.phone.replace(/\s/g, "")}` },
    STORE.whatsapp && { icon: MessageCircle, label: "WhatsApp", value: `+${STORE.whatsapp}`, href: `https://wa.me/${STORE.whatsapp}` },
    STORE.email && { icon: Mail, label: "Email", value: STORE.email, href: `mailto:${STORE.email}` },
    { icon: Clock, label: "Support hours", value: "Mon – Sat, 10am – 8pm", href: null },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string | null }[];

  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Contact us</h1>
      <p className="mt-2 text-gray-600">Questions about a product or your order? We’re happy to help.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value, href }) => {
          const body = (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            </>
          );
          return href ? (
            <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:shadow-lift">{body}</a>
          ) : (
            <div key={label} className="card flex items-center gap-4 p-5">{body}</div>
          );
        })}
      </div>
    </div>
  );
}
