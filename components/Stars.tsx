import { Star } from "lucide-react";

/** Read-only star rating (supports halves visually by rounding to the nearest whole star). */
export default function Stars({ rating, size = "h-4 w-4", className = "" }: { rating: number; size?: string; className?: string }) {
  const full = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= full ? "fill-accent-500 text-accent-500" : "fill-transparent text-ink/20"}`} strokeWidth={1.5} />
      ))}
    </span>
  );
}
