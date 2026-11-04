import { Suspense } from "react";
import Analytics from "@/components/Analytics";
import FlashOfferInit from "@/components/FlashOfferInit";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import VisitTracker from "@/components/VisitTracker";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/lib/cart";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Analytics />
      <VisitTracker />
      <Suspense>
        <FlashOfferInit />
      </Suspense>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </CartProvider>
  );
}
