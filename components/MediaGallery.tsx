"use client";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CirclePlay } from "lucide-react";
import ProductImage from "./ProductImage";
import VideoEmbed from "./VideoEmbed";
import { youTubeId } from "@/lib/format";

type Media = { kind: "image" | "video"; url: string };

export default function MediaGallery({ name, images, videos }: { name: string; images: string[]; videos: string[] }) {
  const media: Media[] = [
    ...images.map((url) => ({ kind: "image" as const, url })),
    ...videos.map((url) => ({ kind: "video" as const, url })),
  ];
  const [index, setIndex] = useState(0);
  const current = media[index];
  const go = (d: number) => setIndex((i) => (i + d + media.length) % media.length);

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-gray-100 bg-gray-100">
        {!current ? (
          <ProductImage alt={name} />
        ) : current.kind === "image" ? (
          <ProductImage src={current.url} alt={name} priority sizes="(max-width:1024px) 100vw, 50vw" />
        ) : (
          <div className="absolute inset-0 flex items-center bg-black">
            <div className="w-full">
              <VideoEmbed key={current.url} url={current.url} title={name} autoPlay />
            </div>
          </div>
        )}
        {media.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {media.map((m, i) => {
            const yt = m.kind === "video" ? youTubeId(m.url) : null;
            return (
              <button
                key={m.url + i}
                onClick={() => setIndex(i)}
                aria-label={`Show ${m.kind} ${i + 1}`}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-100 transition ${
                  i === index ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {m.kind === "image" ? (
                  <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
                ) : yt ? (
                  <Image src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <video src={m.url} muted preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
                )}
                {m.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                    <CirclePlay className="h-7 w-7" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
