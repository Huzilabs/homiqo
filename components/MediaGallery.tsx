"use client";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CirclePlay } from "lucide-react";
import HoverVideo from "./HoverVideo";
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
  const [hover, setHover] = useState(false);
  const current = media[index];
  const go = (d: number) => setIndex((i) => (i + d + media.length) % media.length);

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="relative aspect-[4/5] overflow-hidden bg-sand"
      >
        {!current ? (
          <ProductImage alt={name} />
        ) : current.kind === "image" ? (
          <>
            <ProductImage src={current.url} alt={name} priority sizes="(max-width:1024px) 100vw, 50vw" />
            <HoverVideo url={videos[0]} active={hover} />
            {videos.length > 0 && !hover && (
              <span className="pointer-events-none absolute bottom-5 left-5 bg-paper/95 px-4 py-2.5 text-[10px] font-medium uppercase tracking-[.2em] text-ink">
                ▶ Hover to watch it in action
              </span>
            )}
          </>
        ) : (
          youTubeId(current.url) ? (
            <div className="absolute inset-0 flex items-center bg-black">
              <div className="w-full">
                <VideoEmbed key={current.url} url={current.url} title={name} autoPlay />
              </div>
            </div>
          ) : (
            <video key={current.url} src={current.url} autoPlay muted loop playsInline controls className="absolute inset-0 h-full w-full bg-black object-cover" />
          )
        )}
        {media.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {media.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {media.map((m, i) => {
            const yt = m.kind === "video" ? youTubeId(m.url) : null;
            return (
              <button
                key={m.url + i}
                onClick={() => setIndex(i)}
                aria-label={`Show ${m.kind} ${i + 1}`}
                className={`relative aspect-[4/5] w-full overflow-hidden border-2 bg-sand transition ${
                  i === index ? "border-ink" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {m.kind === "image" ? (
                  <Image src={m.url} alt="" fill sizes="140px" className="object-cover" />
                ) : yt ? (
                  <Image src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`} alt="" fill sizes="140px" className="object-cover" />
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
