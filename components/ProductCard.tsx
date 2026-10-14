"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { CirclePlay, Plus, Truck } from "lucide-react";
import HoverVideo from "./HoverVideo";
import ProductImage from "./ProductImage";
import { discountPercent, formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/config";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const off = discountPercent(product.price, product.compare_at_price);
  const soldOut = product.stock <= 0;
  const video = product.videos[0];

  const start = () => {
    if (!video) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(true), 250);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setPlaying(false);
  };

  return (
    <div
      onMouseEnter={start}
      onMouseLeave={stop}
      className="group relative flex flex-col rounded-[28px] bg-white p-2.5 shadow-card ring-1 ring-brand-50 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-[22px] bg-cream">
        <ProductImage src={product.images[0]} alt={product.name} priority={priority} className="transition duration-700 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
        <HoverVideo url={video} active={playing} />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {off > 0 && <span className="rounded-full bg-accent-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-glow">-{off}%</span>}
          {soldOut && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">Sold out</span>}
        </div>
        {video && !playing && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setPlaying(true);
            }}
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-ink shadow backdrop-blur transition hover:bg-white"
          >
            <CirclePlay className="h-3.5 w-3.5 text-accent-500" /> <span className="hidden sm:inline">Hover to</span> preview
          </button>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-2 pb-1.5 pt-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-leaf-600">{product.category}</p>
        <Link href={`/product/${product.slug}`} className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink transition hover:text-brand-600 sm:text-[15px]">
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-base font-bold text-brand-600 sm:text-lg">{formatPrice(product.price)}</p>
            {off > 0 ? (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.compare_at_price!)}</p>
            ) : product.price >= FREE_SHIPPING_THRESHOLD ? (
              <p className="flex items-center gap-1 text-[11px] font-medium text-leaf-600"><Truck className="h-3 w-3" /> Free delivery</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => add(product, 1)}
            aria-label={`Add ${product.name} to cart`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:rotate-90 hover:bg-accent-500 disabled:bg-gray-300"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {!soldOut && product.stock <= 10 && <p className="mt-2 text-[11px] font-semibold text-accent-600">🔥 Only {product.stock} left</p>}
      </div>
    </div>
  );
}
