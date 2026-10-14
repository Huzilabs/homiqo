"use client";
import Link from "next/link";
import { CirclePlay, ShoppingBag } from "lucide-react";
import ProductImage from "./ProductImage";
import { discountPercent, formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const off = discountPercent(product.price, product.compare_at_price);
  const soldOut = product.stock <= 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          priority={priority}
          className="transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off > 0 && <span className="rounded-full bg-accent-500 px-2.5 py-1 text-xs font-bold text-white">-{off}%</span>}
          {soldOut && <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">Sold out</span>}
        </div>
        {product.videos.length > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 backdrop-blur">
            <CirclePlay className="h-3.5 w-3.5" /> Video
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{product.category}</p>
        <Link href={`/product/${product.slug}`} className="mt-1 line-clamp-2 font-semibold text-ink hover:text-brand-700">
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{product.short_description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-lg font-bold text-ink">{formatPrice(product.price)}</p>
            {off > 0 && <p className="text-sm text-gray-400 line-through">{formatPrice(product.compare_at_price!)}</p>}
          </div>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => add(product, 1)}
            aria-label={`Add ${product.name} to cart`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
