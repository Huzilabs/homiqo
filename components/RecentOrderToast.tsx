"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useFlashOffer } from "@/lib/flash";

type Recent = { first_name: string; city: string; product_name: string; product_slug: string; product_image: string | null; ordered_at: string };

const FIRST_DELAY = 4000, SHOW_FOR = 7000, GAP = 6000, MAX_PER_VISIT = 40;
const HIDE_KEY = "hq.proof.off";

function ago(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/** Bottom-left popup cycling through REAL recent orders (first name, city, product). */
export default function RecentOrderToast() {
  const pathname = usePathname();
  const { offer } = useFlashOffer();
  const [list, setList] = useState<Recent[]>([]);
  const [cur, setCur] = useState<Recent | null>(null);
  const [visible, setVisible] = useState(false);
  const [off, setOff] = useState(true);
  const [topPx, setTopPx] = useState(88);
  const shown = useRef(0);

  // Not on checkout / order pages. While the Meta-offer countdown sits bottom-left, the popup goes just above it.
  const blocked = off || pathname === "/checkout" || pathname.startsWith("/order");
  const raised = Boolean(offer);

  useEffect(() => {
    try { setOff(sessionStorage.getItem(HIDE_KEY) === "1"); } catch { setOff(false); }
    fetch("/api/recent-orders").then((r) => r.json()).then((d) => Array.isArray(d) && setList(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (blocked || !list.length) { setVisible(false); return; }
    let i = Math.floor(Math.random() * list.length);
    let t: ReturnType<typeof setTimeout>;
    const cycle = (delay: number) => {
      t = setTimeout(() => {
        if (shown.current >= MAX_PER_VISIT) return;
        // prefer a different product than the one on screen, so it reads as "others are buying too"
        const onSlug = pathname.startsWith("/product/") ? pathname.split("/")[2] : "";
        let pick = list[i % list.length];
        for (let k = 0; k < list.length && pick.product_slug === onSlug && list.length > 1 && k < 1; k++) pick = list[++i % list.length];
        i++;
        // sit just under the sticky header (its position changes while the top bar scrolls away)
        const hb = document.querySelector("header")?.getBoundingClientRect().bottom;
        setTopPx(Math.max(8, Math.round(hb ?? 80)) + 8);
        setCur(pick); setVisible(true); shown.current++;
        t = setTimeout(() => { setVisible(false); cycle(GAP); }, SHOW_FOR);
      }, delay);
    };
    cycle(shown.current ? GAP : FIRST_DELAY);
    return () => clearTimeout(t);
  }, [blocked, list, pathname]);

  if (!cur || blocked) return null;
  const onProduct = pathname.startsWith("/product/");

  return (
    <div
      role="status"
      style={onProduct && typeof window !== "undefined" && window.innerWidth < 1024 ? { top: topPx } : undefined}
      aria-live="polite"
      // Phones, product page: top (over the photo) so it never covers the price or the Buy Now bar. Elsewhere: bottom-left.
      className={`fixed left-3 right-[4.5rem] z-[45] transition-all duration-500 sm:right-auto sm:w-[420px] max-sm:max-w-[330px] lg:bottom-6 lg:left-6 lg:top-auto ${
        onProduct ? (raised ? "lg:!bottom-24" : "") : raised ? "bottom-[4.5rem] lg:!bottom-24" : "bottom-4"
      } ${visible ? "translate-y-0 opacity-100" : `pointer-events-none opacity-0 ${onProduct ? "max-lg:-translate-y-4 lg:translate-y-4" : "translate-y-4"}`}`}
    >
      <div className="relative flex items-center gap-3 border border-ink/10 bg-white p-2 pr-8 shadow-[0_10px_40px_-8px_rgba(14,42,40,.35)] sm:gap-4 sm:p-3 sm:pr-10">
        <Link href={`/product/${cur.product_slug}`} className="relative h-14 w-14 shrink-0 overflow-hidden bg-sand sm:h-[76px] sm:w-[76px]">
          {cur.product_image && <Image src={cur.product_image} alt="" fill sizes="(max-width:640px) 56px, 76px" className="object-cover" />}
        </Link>
        <Link href={`/product/${cur.product_slug}`} className="min-w-0 text-[14px] leading-snug text-ink sm:text-[16px]">
          <span className="font-semibold">{cur.first_name}</span> from <span className="font-semibold">{cur.city}</span> ordered
          <span className="block truncate font-semibold text-brand-700">{cur.product_name}</span>
          <span className="mt-0.5 block text-[12px] text-ink/55 sm:text-[13px]">{ago(cur.ordered_at)} · ✓ Verified order</span>
        </Link>
        <button
          type="button"
          aria-label="Hide"
          onClick={() => { setVisible(false); setOff(true); try { sessionStorage.setItem(HIDE_KEY, "1"); } catch {} }}
          className="absolute right-1.5 top-1.5 p-1 text-ink/40 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
