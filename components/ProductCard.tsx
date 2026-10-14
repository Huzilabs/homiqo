"use client";
import Image from "next/image";
import Link from "next/link";
import { CirclePlay, ShoppingBag, Truck } from "lucide-react";
import ProductImage from "./ProductImage";
import { discountPercent, formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/config";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { add } = useCart();
  const off = discountPercent(product.price, product.compare_at_price);
  const soldOut = product.stock <= 0;
  const second = product.images[1];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-gray-200">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
        <ProductImage src={product.images[0]} alt={product.name} priority={priority} className="transition duration-700 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
        {second && (
          <Image src={second} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {off > 0 && <span className="rounded-full bg-accent-500 px-2.5 py-1 text-xs font-bold text-white shadow">-{off}%</span>}
          {soldOut && <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">Sold out</span>}
        </div>
        {product.videos.length > 0 && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <CirclePlay className="h-3.5 w-3.5" /> Watch demo
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600">{product.category}</p>
        <Link href={`/product/${product.slug}`} className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-ink hover:text-brand-700 sm:text-base">
          {product.name}
        </Link>
        <p className="mt-1 hidden text-sm text-gray-500 sm:line-clamp-2">{product.short_description}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-ink sm:text-xl">{formatPrice(product.price)}</span>
          {off > 0 && <span className="text-sm text-gray-400 line-through">{formatPrice(product.compare_at_price!)}</span>}
        </div>
        <p className="mt-1 text-xs font-medium">
          {soldOut ? (
            <span className="text-rose-600">Out of stock</span>
          ) : product.stock <= 10 ? (
            <span className="text-accent-600">Only {product.stock} left</span>
          ) : product.price >= FREE_SHIPPING_THRESHOLD ? (
            <span className="inline-flex items-center gap-1 text-brand-700"><Truck className="h-3.5 w-3.5" /> Free delivery</span>
          ) : (
            <span className="text-gray-500">In stock · COD available</span>
          )}
        </p>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => add(product, 1)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <ShoppingBag className="h-4 w-4" /> Add to cart
        </button>
      </div>
    </div>
  );
}
