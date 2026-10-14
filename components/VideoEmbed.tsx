import { youTubeId } from "@/lib/format";

export default function VideoEmbed({ url, title, autoPlay }: { url: string; title: string; autoPlay?: boolean }) {
  const yt = youTubeId(url);
  return (
    <div className="relative aspect-video bg-black">
      {yt ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${yt}${autoPlay ? "?autoplay=1&rel=0&modestbranding=1" : "?rel=0&modestbranding=1"}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <video
          src={url}
          controls
          autoPlay={autoPlay}
          muted={autoPlay}
          preload="metadata"
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
    </div>
  );
}
