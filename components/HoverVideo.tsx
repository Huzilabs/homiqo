"use client";
import { useEffect, useRef } from "react";
import { youTubeId } from "@/lib/format";

/** Muted, looping video file that fills its (relative) parent. Mounted only while active; YouTube links are ignored. */
export default function HoverVideo({ url, active, className = "" }: { url?: string; active: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (active) ref.current?.play().catch(() => {});
  }, [active]);
  if (!url || !active || youTubeId(url)) return null;
  return (
    <video
      ref={ref}
      src={url}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={`pointer-events-none absolute inset-0 h-full w-full animate-fade-in object-cover ${className}`}
    />
  );
}
