import Image from "next/image";
import { Beef, Carrot, Coffee, Droplets, Package, Slice, Sparkles } from "lucide-react";

function iconFor(name: string) {
  const n = name.toLowerCase();
  if (n.includes("coffee")) return Coffee;
  if (n.includes("sink")) return Droplets;
  if (n.includes("vacuum")) return Sparkles;
  if (n.includes("qeema") || n.includes("food chopper")) return Beef;
  if (n.includes("knife")) return Slice;
  if (n.includes("vegetable")) return Carrot;
  return Package;
}

const tones = [
  "from-brand-100 to-brand-200 text-brand-700",
  "from-accent-50 to-accent-100 text-accent-600",
  "from-sky-50 to-sky-100 text-sky-700",
  "from-violet-50 to-violet-100 text-violet-700",
];

export default function ProductImage({
  src,
  alt,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority,
  className = "",
}: {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
  }
  const Icon = iconFor(alt);
  const tone = tones[alt.length % tones.length];
  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${tone} ${className}`}>
      <Icon className="h-1/3 w-1/3 opacity-80" strokeWidth={1.25} aria-hidden />
      <span className="sr-only">{alt}</span>
    </div>
  );
}
