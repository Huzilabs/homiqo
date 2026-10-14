"use client";
import { useEffect, useState } from "react";

/** Counts down to midnight Pakistan time — the daily deal rolls over then. */
function msToMidnightPKT() {
  const now = new Date();
  const pkt = new Date(now.getTime() + (now.getTimezoneOffset() + 300) * 60000);
  const end = new Date(pkt);
  end.setHours(24, 0, 0, 0);
  return end.getTime() - pkt.getTime();
}

export default function Countdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    setMs(msToMidnightPKT());
    const t = setInterval(() => setMs(msToMidnightPKT()), 1000);
    return () => clearInterval(t);
  }, []);
  const parts = ms == null ? ["--", "--", "--"] : [ms / 3.6e6, (ms / 6e4) % 60, (ms / 1e3) % 60].map((n) => String(Math.floor(n)).padStart(2, "0"));
  return (
    <div className="flex gap-2" aria-label="Time left on today's deal">
      {["Hours", "Mins", "Secs"].map((label, i) => (
        <div key={label} className="flex w-16 flex-col items-center rounded-xl bg-white/10 py-2 ring-1 ring-white/20 backdrop-blur">
          <span className="text-2xl font-extrabold tabular-nums">{parts[i]}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/70">{label}</span>
        </div>
      ))}
    </div>
  );
}
