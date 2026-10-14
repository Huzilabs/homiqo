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
    if (!video) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(true), 200);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setPlaying(false);
  };

  return (
    <div className="group" onMouseEnter={start} onMouseLeave={stop}>
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Link href={`/product/${product.slug}`} className="absolute inset-0" aria-label={product.name}>
          <ProductImage src={product.images[0]} alt={product.name} priority={priority} sizes="(max-width: 768px) 50vw, 25vw" className="transition duration-[1.2s] ease-out group-hover:scale-[1.04]" />
          <HoverVideo url={video} active={playing} />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="bg-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-[.16em] text-white">Sold out</span>
          ) : off > 0 ? (
            <span className="bg-accent-600 px-2.5 py-1 text-[10px] font-medium tracking-[.12em] text-white">−{off}%</span>
          ) : null}
          {product.is_featured && !soldOut && (
            <span className="bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-[.16em] text-ink">Bestseller</span>
          )}
        </div>

        {video && (
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Stop preview" : "Play preview"}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white"
          >
            <Play className={`h-3.5 w-3.5 fill-current ${playing ? "opacity-40" : ""}`} />
          </button>
        )}

        <button
          type="button"
          disabled={soldOut}
          onClick={() => add(product, 1)}
          className="absolute inset-x-3 bottom-3 translate-y-[calc(100%+12px)] bg-white py-3.5 text-[11px] font-medium uppercase tracking-[.2em] text-ink opacity-0 transition duration-300 hover:bg-ink hover:text-white group-hover:translate-y-0 group-hover:opacity-100 disabled:hidden max-lg:translate-y-0 max-lg:opacity-100 max-lg:py-2.5 max-lg:text-[10px]"
        >
          Add to cart
        </button>
      </div>

      <div className="pt-4">
        <p className="text-[10px] font-medium uppercase tracking-[.2em] text-ink/50 sm:text-[11px]">{product.category}</p>
        <Link href={`/product/${product.slug}`} className="h-card mt-1.5 block text-ink transition hover:text-brand-600">
          {product.name}
        </Link>
        <p className="mt-1.5 flex items-baseline gap-2.5 text-sm">
          <span className={`font-medium ${off > 0 ? "text-accent-700" : "text-ink"}`}>{formatPrice(product.price)}</span>
          {off > 0 && <span className="text-xs text-ink/40 line-through">{formatPrice(product.compare_at_price!)}</span>}
        </p>
      </div>
    </div>
  );
}
