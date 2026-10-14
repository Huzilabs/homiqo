"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CirclePlay, X } from "lucide-react";
import VideoEmbed from "./VideoEmbed";
import { formatPrice, youTubeId } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function VideoShowcase({ products }: { products: Product[] }) {
  const [open, setOpen] = useState<Product | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => {
          const yt = youTubeId(p.videos[0]);
          const thumb = yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : p.images[0];
          return (
            <div key={p.id} className="group w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:w-auto">
              <button onClick={() => setOpen(p)} className="relative block aspect-[9/12] w-full overflow-hidden" aria-label={`Play ${p.name} video`}>
                {thumb && <Image src={thumb} alt="" fill sizes="(max-width:640px) 80vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-xl transition group-hover:scale-110">
                  <CirclePlay className="h-9 w-9" strokeWidth={1.5} />
                </span>
                <span className="absolute inset-x-0 bottom-0 p-4 text-left">
                  <span className="block font-semibold text-white">{p.name}</span>
                  <span className="text-sm text-white/70">{formatPrice(p.price)}</span>
                </span>
              </button>
              <Link href={`/product/${p.slug}`} className="block border-t border-white/10 py-3 text-center text-sm font-semibold text-accent-400 hover:bg-white/5">
                Shop now →
              </Link>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <div className="w-full max-w-4xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-white">
              <p className="font-semibold">{open.name}</p>
              <button onClick={() => setOpen(null)} aria-label="Close video" className="rounded-full p-2 hover:bg-white/10">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl">
              <VideoEmbed url={open.videos[0]} title={open.name} autoPlay />
            </div>
            <div className="mt-4 flex justify-center">
              <Link href={`/product/${open.slug}`} className="btn-accent px-8">Buy {open.name} — {formatPrice(open.price)}</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
