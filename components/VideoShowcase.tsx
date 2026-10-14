"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import HoverVideo from "./HoverVideo";
import ProductImage from "./ProductImage";
import VideoEmbed from "./VideoEmbed";
import { formatPrice, previewVideo, youTubeVideos } from "@/lib/format";
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
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <div
            key={p.id}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            onTouchStart={() => setHover(p.id)}
            className="group relative aspect-[3/4] w-[78%] shrink-0 snap-start overflow-hidden bg-brand-900 sm:w-auto"
          >
            <ProductImage src={p.images[0]} alt={p.name} sizes="(max-width:640px) 80vw, 25vw" className="opacity-90 transition duration-[1.2s] group-hover:scale-[1.04]" />
            <HoverVideo url={previewVideo(p.videos)} active={hover === p.id} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
            {hover !== p.id && (
              <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 text-white backdrop-blur-sm">
                <Play className="h-5 w-5 translate-x-0.5 fill-current" />
              </span>
            )}
            {youTubeVideos(p.videos).length > 0 && (
              <button
                onClick={() => setOpen(p)}
                className="absolute right-3 top-3 bg-white/95 px-3 py-2 text-[10px] font-medium uppercase tracking-[.18em] text-ink transition hover:bg-accent-500 hover:text-white"
              >
                Watch on YouTube
              </button>
            )}
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="font-serif text-2xl leading-tight">{p.name}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4">
                <span className="text-sm">{formatPrice(p.price)}</span>
                <Link href={`/product/${p.slug}`} className="text-[11px] font-medium uppercase tracking-[.2em] underline-offset-4 hover:underline">
                  Shop now →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <div className="w-full max-w-5xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between text-white">
              <p className="font-serif text-2xl">{open.name}</p>
              <button onClick={() => setOpen(null)} aria-label="Close video" className="p-2 hover:text-accent-400"><X className="h-6 w-6" strokeWidth={1.5} /></button>
            </div>
            <VideoEmbed url={youTubeVideos(open.videos)[0]} title={open.name} autoPlay />
            <div className="mt-6 flex justify-center">
              <Link href={`/product/${open.slug}`} className="btn-accent">Shop now · {formatPrice(open.price)}</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
