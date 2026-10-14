"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CirclePlay, Volume2, X } from "lucide-react";
import HoverVideo from "./HoverVideo";
import ProductImage from "./ProductImage";
import VideoEmbed from "./VideoEmbed";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function VideoShowcase({ products }: { products: Product[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const [open, setOpen] = useState<Product | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <div
            key={p.id}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            className="group relative aspect-[9/14] w-[72%] shrink-0 snap-start overflow-hidden rounded-[28px] bg-brand-800 sm:w-auto"
          >
            <ProductImage src={p.images[0]} alt={p.name} sizes="(max-width:640px) 75vw, 25vw" className="transition duration-700 group-hover:scale-105" />
            <HoverVideo url={p.videos[0]} active={hover === p.id} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/10 to-transparent" />
            <button
              onClick={() => setOpen(p)}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25"
            >
              <Volume2 className="h-3.5 w-3.5" /> Watch with sound
            </button>
            {hover !== p.id && (
              <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-xl">
                <CirclePlay className="h-9 w-9" strokeWidth={1.5} />
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="font-semibold leading-tight">{p.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-accent-400">{formatPrice(p.price)}</span>
                <Link href={`/product/${p.slug}`} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-700 transition hover:bg-accent-500 hover:text-white">
                  Shop now
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/90 p-4 backdrop-blur" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <div className="w-full max-w-4xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-white">
              <p className="font-semibold">{open.name}</p>
              <button onClick={() => setOpen(null)} aria-label="Close video" className="rounded-full p-2 hover:bg-white/10"><X className="h-6 w-6" /></button>
            </div>
            <div className="overflow-hidden rounded-3xl"><VideoEmbed url={open.videos[0]} title={open.name} autoPlay /></div>
            <div className="mt-5 flex justify-center">
              <Link href={`/product/${open.slug}`} className="btn-accent px-8">Buy now · {formatPrice(open.price)}</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
