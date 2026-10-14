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

export default function Countdown({ dark }: { dark?: boolean }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    setMs(msToMidnightPKT());
    const t = setInterval(() => setMs(msToMidnightPKT()), 1000);
    return () => clearInterval(t);
  }, []);
  const parts = ms == null ? ["--", "--", "--"] : [ms / 3.6e6, (ms / 6e4) % 60, (ms / 1e3) % 60].map((n) => String(Math.floor(n)).padStart(2, "0"));
  return (
    <div className="flex items-start gap-3" aria-label="Time left on today's deal">
      {["Hours", "Minutes", "Seconds"].map((label, i) => (
        <div key={label} className="flex items-start gap-3">
          <div className={`flex w-[76px] flex-col items-center border py-3 ${dark ? "border-white/20" : "border-ink/15 bg-white"}`}>
            <span className="font-serif text-4xl font-medium tabular-nums leading-none">{parts[i]}</span>
            <span className={`mt-2 text-[9px] uppercase tracking-[.2em] ${dark ? "text-white/60" : "text-ink/50"}`}>{label}</span>
          </div>
          {i < 2 && <span className="pt-3 font-serif text-3xl opacity-40">:</span>}
        </div>
      ))}
    </div>
  );
}
