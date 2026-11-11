"use client";
import { useEffect, useState } from "react";
import { Clock, Flame, ShoppingBag, Truck } from "lucide-react";

/** Daily order cut-off (Pakistan time): orders confirmed by 6 PM are booked on PostEx that day. */
export const CUTOFF_HOUR_PKT = 18;

const PKT_OFFSET_MIN = 300; // UTC+5, no daylight saving

/** ms until the next 6 PM in Pakistan */
export function msToCutoff(now = Date.now()) {
  const pkt = new Date(now + PKT_OFFSET_MIN * 60000); // shifted clock, read with getUTC*
  const cut = new Date(pkt);
  cut.setUTCHours(CUTOFF_HOUR_PKT, 0, 0, 0);
  if (pkt.getTime() >= cut.getTime()) cut.setUTCDate(cut.getUTCDate() + 1);
  return cut.getTime() - pkt.getTime();
}

/** true if it's still before today's 6 PM in Pakistan */
export const beforeCutoff = (now = Date.now()) => new Date(now + PKT_OFFSET_MIN * 60000).getUTCHours() < CUTOFF_HOUR_PKT;

const fmt = (ms: number, withSeconds = false) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return withSeconds ? `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s` : `${h}h ${m}m`;
};

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export default function UrgencyBox({
  stock,
  saleEndsAt,
  hasDiscount,
  recentOrders,
}: {
  stock: number;
  saleEndsAt?: string | null;
  hasDiscount: boolean;
  recentOrders: number;
}) {
  const now = useNow();
  const saleMs = saleEndsAt ? new Date(saleEndsAt).getTime() - (now ?? Date.now()) : 0;
  const saleLive = Boolean(saleEndsAt) && hasDiscount && saleMs > 0;
  const soldOut = stock <= 0;

  return (
    <div className="mt-4 space-y-2.5">
      {/* Real sale end — the price really goes back up when this reaches zero */}
      {saleLive && (
        <p className="flex items-center gap-2.5 border border-accent-500/40 bg-accent-50 px-4 py-3 text-sm text-accent-700">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Sale ends in <b className="tabular-nums">{now == null ? "…" : fmt(saleMs, true)}</b> — then the price goes back up
          </span>
        </p>
      )}

      {/* Real stock — only shown when it is genuinely low */}
      {!soldOut && stock <= 5 && (
        <p className="flex items-center gap-2.5 text-sm font-medium text-rose-700">
          <Flame className="h-4 w-4 shrink-0" /> Only {stock} left in stock — order soon
        </p>
      )}

      {/* Real orders from the last 7 days */}
      {recentOrders >= 3 && (
        <p className="flex items-center gap-2.5 text-sm text-ink/70">
          <ShoppingBag className="h-4 w-4 shrink-0 text-brand-600" /> {recentOrders} people ordered this in the last 7 days
        </p>
      )}

      {/* Real daily cut-off */}
      {!soldOut && (
        <div className="flex items-center gap-3 border border-brand-600/25 bg-brand-50 px-4 py-3 text-sm text-ink/75">
          <Truck className="h-5 w-5 shrink-0 text-brand-600" />
          <span>
            Order within{" "}
            <b className="inline-block rounded bg-ink px-2 py-0.5 font-semibold tabular-nums text-white">
              {now == null ? "--h --m --s" : fmt(msToCutoff(now), true)}
            </b>{" "}
            and we book it with the courier {now == null || beforeCutoff(now) ? "today" : "by tomorrow"}.
          </span>
        </div>
      )}
    </div>
  );
}

/** Large countdown: a real sale end if given, otherwise the daily 6 PM order cut-off. */
export function BigCountdown({ endsAt, dark }: { endsAt?: string | null; dark?: boolean }) {
  const now = useNow();
  const saleMs = endsAt && now != null ? new Date(endsAt).getTime() - now : 0;
  const isSale = Boolean(endsAt) && (now == null || saleMs > 0);
  const ms = now == null ? null : isSale ? saleMs : msToCutoff(now);
  const parts = ms == null ? ["--", "--", "--"] : [ms / 3.6e6, (ms / 6e4) % 60, (ms / 1e3) % 60].map((n) => String(Math.floor(n)).padStart(2, "0"));
  return (
    <div>
      <p className={`mb-3 text-[11px] uppercase tracking-[.2em] ${dark ? "text-white/60" : "text-ink/55"}`}>
        {isSale ? "Sale ends in — then the price goes back up" : "Order within — to be booked with the courier today"}
      </p>
      <div className="flex items-start gap-3" aria-label={isSale ? "Time left in the sale" : "Time left until today's order cut-off"}>
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
    </div>
  );
}
