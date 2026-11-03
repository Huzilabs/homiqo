"use client";
import { useEffect, useRef, useState } from "react";
import HoverVideo from "./HoverVideo";

type Conn = { saveData?: boolean; effectiveType?: string };

/**
 * Starts a muted looping video once its box scrolls into view (and stops when it leaves).
 * deferUntilLoad: wait until the page has fully loaded (keeps the hero photo/headline fast — better LCP).
 * minWidth: skip the video on smaller screens (mobile data), showing the photo instead.
 */
export default function InViewVideo({
  url,
  className = "",
  deferUntilLoad = false,
  minWidth = 0,
}: {
  url?: string;
  className?: string;
  deferUntilLoad?: boolean;
  minWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [allowed, setAllowed] = useState(!deferUntilLoad && minWidth === 0);

  useEffect(() => {
    if (allowed) return;
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    if (conn?.saveData || /(^|-)2g$|3g/.test(conn?.effectiveType || "")) return;
    if (minWidth && window.innerWidth < minWidth) return;
    let timer: ReturnType<typeof setTimeout>;
    const go = () => (timer = setTimeout(() => setAllowed(true), 1200));
    if (!deferUntilLoad || document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", go);
    };
  }, [allowed, deferUntilLoad, minWidth]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`absolute inset-0 ${className}`}>
      <HoverVideo url={url} active={visible && allowed} />
    </div>
  );
}
