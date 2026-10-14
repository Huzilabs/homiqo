"use client";
import { useEffect, useRef, useState } from "react";
import HoverVideo from "./HoverVideo";

/** Starts a muted looping video once its box scrolls into view (and stops when it leaves). */
export default function InViewVideo({ url, className = "" }: { url?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`absolute inset-0 ${className}`}>
      <HoverVideo url={url} active={visible} />
    </div>
  );
}
