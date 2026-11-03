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
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105 lg:bottom-6 lg:right-6 lg:h-14 lg:w-14 ${
        pathname.startsWith("/product/") ? "bottom-28" : "bottom-6"
      }`}
    >
      <MessageCircle className="h-6 w-6 lg:h-7 lg:w-7" />
    </a>
  );
}
