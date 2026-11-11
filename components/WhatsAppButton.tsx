"use client";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { STORE } from "@/lib/config";

export default function WhatsAppButton() {
  const pathname = usePathname();
  // Cart and checkout show their own WhatsApp link; the floating button would cover the totals there
  if (!STORE.whatsapp || pathname === "/cart" || pathname === "/checkout") return null;
  return (
    <a
      href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(`Hi ${STORE.name}, I have a question.`)}`}
      onClick={(e) => {
        // On a product page, say which product they want to order
        const p = (window as unknown as { __hqProduct?: { name: string; price: string; url: string } }).__hqProduct;
        if (p && pathname.startsWith("/product/")) {
          const text = `Assalam o Alaikum ${STORE.name}! I want to order this product:\n\n*${p.name}* (${p.price})\n${p.url}`;
          e.currentTarget.href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
        }
      }}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed bottom-6 right-4 z-30 h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105 lg:right-6 lg:h-14 lg:w-14 ${
        // product pages on mobile have a WhatsApp button in the sticky order bar
        pathname.startsWith("/product/") ? "hidden lg:flex" : "flex"
      }`}
    >
      <MessageCircle className="h-6 w-6 lg:h-7 lg:w-7" />
    </a>
  );
}
