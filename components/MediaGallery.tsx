"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Banknote, ChevronLeft, ChevronRight, CirclePlay, PackageOpen, Truck } from "lucide-react";
import HoverVideo from "./HoverVideo";
import ProductImage from "./ProductImage";
import VideoEmbed from "./VideoEmbed";
import { youTubeId } from "@/lib/format";
import { sendVisitEvent } from "@/lib/visits";

type Media = { kind: "image" | "video"; url: string };

/** one video_play event per video per page load */
const videoSent: Record<string, boolean> = {};

export default function MediaGallery({ name, images, videos, productId, badge }: { name: string; images: string[]; videos: string[]; productId?: string; badge?: string }) {
  // Video first (the best proof the product works), then the photos.
  // It starts as the main photo (fast first paint) and switches to the muted video once the page has loaded.
  const fileVideo = videos.find((v) => !youTubeId(v));
  const media: Media[] = fileVideo
    ? [{ kind: "video" as const, url: fileVideo }, ...images.map((url) => ({ kind: "image" as const, url }))]
    : [
        ...images.slice(0, 1).map((url) => ({ kind: "image" as const, url })),
        ...videos.map((url) => ({ kind: "video" as const, url })),
        ...images.slice(1).map((url) => ({ kind: "image" as const, url })),
      ];
  const [index, setIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => {
    if (!fileVideo) return;
    const start = () => setTimeout(() => setVideoReady(true), 800);
    if (document.readyState === "complete") { const t = start(); return () => clearTimeout(t); }
    let t: ReturnType<typeof setTimeout>;
    const onLoad = () => { t = start(); };
    window.addEventListener("load", onLoad, { once: true });
    return () => { window.removeEventListener("load", onLoad); clearTimeout(t); };
  }, [fileVideo]);
  const [hover, setHover] = useState(false);
  const current = media[index];
  const go = (d: number) => setIndex((i) => (i + d + media.length) % media.length);
  // swipe left / right on phones
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s0 = touch.current; touch.current = null;
    if (!s0 || media.length < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s0.x, dy = t.clientY - s0.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative aspect-[6/7] max-h-[calc(100svh-300px)] w-full max-w-[min(560px,calc(100svh-250px))] lg:max-h-none overflow-hidden bg-white lg:aspect-square"
      >
        {!current ? (
          <ProductImage alt={name} />
        ) : current.kind === "image" ? (
          <>
            <ProductImage
              src={current.url}
              alt={images.length > 1 ? `${name} — photo ${images.indexOf(current.url) + 1} of ${images.length}` : name}
              priority={index === 0}
              sizes="(max-width:1024px) 100vw, 50vw"
            />
            <HoverVideo url={videos[0]} active={hover} />
            {videos.length > 0 && (
              <button
                type="button"
                onClick={() => setIndex(Math.max(0, media.findIndex((m) => m.kind === "video")))}
                className="absolute bottom-[72px] left-3 bg-paper/95 px-3.5 py-2 text-[10px] font-medium uppercase tracking-[.2em] text-ink hover:bg-white sm:bottom-16"
              >
                ▶ Watch it in action
              </button>
            )}
          </>
        ) : (
          youTubeId(current.url) ? (
            <div className="absolute inset-0 flex items-center bg-black">
              <div className="w-full">
                <VideoEmbed key={current.url} url={current.url} title={name} autoPlay />
              </div>
            </div>
          ) : index === 0 && fileVideo && !videoReady ? (
            <ProductImage src={images[0]} alt={name} priority sizes="(max-width:1024px) 100vw, 50vw" />
          ) : (
            <video key={current.url} src={current.url} poster={images[0]} autoPlay muted loop={media.length < 2} playsInline controls onEnded={() => media.length > 1 && go(1)} onPlay={() => { if (!videoSent[current.url]) { videoSent[current.url] = true; sendVisitEvent("video_play", { pid: productId }); } }} className="absolute inset-0 h-full w-full bg-black object-cover" />
          )
        )}
        {badge && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-rose-600 px-2.5 py-1.5 text-[13px] font-bold text-white shadow">{badge}</span>
        )}
        {/* the three COD promises, right on the photo / video */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 grid grid-cols-3 bg-white/95 text-[10.5px] font-medium leading-tight text-ink backdrop-blur-sm sm:text-[13px] sm:font-semibold">
          {[
            { Icon: Truck, label: "Free delivery" },
            { Icon: PackageOpen, label: "Open & check" },
            { Icon: Banknote, label: "Cash on delivery" },
          ].map(({ Icon, label }, i) => (
            <span key={label} className={`flex flex-col items-center justify-center gap-1 whitespace-nowrap px-1 py-2 sm:flex-row sm:gap-1.5 sm:py-3 ${i === 1 ? "border-x border-ink/10" : ""}`}>
              <Icon className="h-[18px] w-[18px] shrink-0 text-brand-600" strokeWidth={1.8} /> {label}
            </span>
          ))}
        </div>
        {media.length > 1 && (
          <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/65 px-2.5 py-1 text-[12px] font-semibold text-white">
            {index + 1} / {media.length}{current?.kind === "video" ? " · Video" : ""}
          </span>
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

      {/* phones: small dots (swipe / arrows to move); desktop: thumbnails */}
      {media.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5 lg:hidden" aria-hidden>
          {media.map((m, i) => (
            <span key={m.url + i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/20"}`} />
          ))}
        </div>
      )}
      {media.length > 1 && (
        <div className="mt-3 hidden w-full min-w-0 max-w-[min(560px,calc(100svh-250px))] gap-2 overflow-x-auto pb-1 lg:flex">
          {media.map((m, i) => {
            const yt = m.kind === "video" ? youTubeId(m.url) : null;
            return (
              <button
                key={m.url + i}
                onClick={() => setIndex(i)}
                aria-label={`Show ${m.kind} ${i + 1}`}
                className={`relative h-20 w-20 shrink-0 overflow-hidden border-2 bg-sand transition sm:h-24 sm:w-24 ${
                  i === index ? "border-ink" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {m.kind === "image" ? (
                  <Image src={m.url} alt={`${name} thumbnail ${i + 1}`} fill sizes="140px" className="bg-white object-contain" />
                ) : yt ? (
                  <Image src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`} alt={`${name} video`} fill sizes="140px" className="object-cover" />
                ) : (
                  // a photo, not a <video> — a video thumbnail downloads the clip on page load (slower for ad visitors)
                  images[0] ? <Image src={images[0]} alt={`${name} video`} fill sizes="140px" className="bg-white object-contain" /> : null
                )}
                {m.kind === "video" && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/35 text-white">
                    <CirclePlay className="h-6 w-6" />
                    <span className="text-[9px] font-medium uppercase tracking-[.15em]">Video</span>
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
