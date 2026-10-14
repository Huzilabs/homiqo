"use client";
import { youTubeId } from "@/lib/format";

/** Muted, looping, chrome-less video that fills its (relative) parent. Only mounted while active. */
export default function HoverVideo({ url, active, className = "" }: { url?: string; active: boolean; className?: string }) {
  if (!url || !active) return null;
  const yt = youTubeId(url);
  return (
    <div className={`cover-video absolute inset-0 overflow-hidden bg-black animate-fade-in ${className}`}>
      {yt ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&controls=0&loop=1&playlist=${yt}&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`}
          title="Product video"
          allow="autoplay; encrypted-media; picture-in-picture"
          tabIndex={-1}
        />
      ) : (
        <video src={url} autoPlay muted loop playsInline />
      )}
    </div>
  );
}
