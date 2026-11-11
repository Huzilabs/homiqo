"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Play } from "lucide-react";
import HoverVideo from "./HoverVideo";
import ProductImage from "./ProductImage";
import { discountPercent, formatPrice, previewVideo } from "@/lib/format";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const off = discountPercent(product.price, product.compare_at_price);
  const soldOut = product.stock <= 0;
  const video = previewVideo(product.videos);

  const start = () => {
    // Phones fire "mouseenter" on touch/scroll — only auto-preview on real hover devices (mouse)
    if (!video || typeof window === "undefined" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(true), 200);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setPlaying(false);
  };

  return (
    <div className="group flex h-full flex-col" onMouseEnter={start} onMouseLeave={stop}>
      <div className="relative aspect-square overflow-hidden bg-white">
        <Link href={`/product/${product.slug}`} className="absolute inset-0" aria-label={product.name}>
          <ProductImage src={product.images[0]} alt={product.name} priority={priority} sizes="(max-width: 768px) 50vw, 25vw" />
          <HoverVideo url={video} active={playing} />
        </Link>

        <div data-nosnippet className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
          {soldOut ? (
            <span className="bg-ink px-2 py-0.5 text-[9px] font-medium uppercase tracking-[.14em] text-white sm:px-2.5 sm:py-1 sm:text-[10px]">Sold out</span>
          ) : off > 0 ? (
            <span className="bg-accent-600 px-2 py-0.5 text-[9px] font-medium tracking-[.1em] text-white sm:px-2.5 sm:py-1 sm:text-[10px]">−{off}%</span>
          ) : null}
          {product.is_featured && !soldOut && (
            <span className="hidden bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[.16em] text-ink lg:inline-block">Bestseller</span>
          )}
        </div>

        {video && (
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Stop preview" : "Play preview"}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white sm:right-3 sm:top-3 sm:h-9 sm:w-9"
          >
            <Play className={`h-3.5 w-3.5 fill-current ${playing ? "opacity-40" : ""}`} />
          </button>
        )}

        <button
          type="button"
          data-nosnippet
          disabled={soldOut}
          onClick={() => add(product, 1)}
          className="absolute inset-x-3 bottom-3 hidden translate-y-[calc(100%+12px)] bg-white py-3.5 text-[11px] font-medium uppercase tracking-[.2em] text-ink opacity-0 transition duration-300 hover:bg-ink hover:text-white group-hover:translate-y-0 group-hover:opacity-100 disabled:hidden lg:block"
        >
          Add to cart
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[10px] font-medium uppercase tracking-[.2em] text-ink/50 sm:text-[11px]">{product.category}</p>
        <Link href={`/product/${product.slug}`} className="h-card mt-1.5 line-clamp-2 min-h-[2.6em] text-ink transition hover:text-brand-600 max-sm:text-[1.05rem] max-sm:leading-snug">
          {product.name}
        </Link>
        <p className="mb-3 mt-1.5 flex items-baseline gap-2.5 text-sm">
          <span className={`font-medium ${off > 0 ? "text-accent-700" : "text-ink"}`}>{formatPrice(product.price)}</span>
          {off > 0 && <span data-nosnippet className="text-xs text-ink/40 line-through">{formatPrice(product.compare_at_price!)}</span>}
        </p>
        {!soldOut && (
          <button
            type="button"
            data-nosnippet
            onClick={() => add(product, 1)}
            className="mt-auto w-full border border-ink/80 py-2.5 text-[10px] font-medium uppercase tracking-[.18em] text-ink transition active:bg-ink active:text-white lg:hidden"
          >
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
}
