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
      className="fixed bottom-20 right-4 z-30 lg:bottom-6 lg:right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
