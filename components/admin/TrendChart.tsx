"use client";
import { useMemo, useRef, useState } from "react";

export interface TrendPoint { date: string; revenue: number; spend: number; orders: number }

// Validated pair (dataviz validator: lightness, chroma, CVD & normal-vision separation pass on white)
const SERIES = [
  { key: "revenue" as const, label: "Store revenue", color: "#0F9A92" },
  { key: "spend" as const, label: "Ad spend", color: "#E67A00" },
];

const W = 900, H = 280, PAD = { t: 16, r: 16, b: 32, l: 56 };
const short = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : String(Math.round(n)));
const rs = (n: number) => "Rs " + Math.round(n).toLocaleString("en-PK");
const day = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short" });

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const svg = useRef<SVGSVGElement>(null);

  const { max, x, y, ticks } = useMemo(() => {
    const raw = Math.max(1, ...data.flatMap((d) => [d.revenue, d.spend]));
    // "nice" tick step: 1, 2, 2.5 or 5 × 10^n so 4 gridlines land on round numbers
    const rough = raw / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= rough) || 10) * mag;
    const max = Math.max(step, Math.ceil(raw / step) * step);
    const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
    return {
      max,
      x: (i: number) => PAD.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw),
      y: (v: number) => PAD.t + ih - (v / max) * ih,
      ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step),
    };
  }, [data]);

  const path = (k: "revenue" | "spend") => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join("");

  const onMove = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    data.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; });
    setHover(best);
  };

  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  const h = hover != null ? data[hover] : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-5 text-sm text-gray-700">
          {SERIES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-2">
              <span className="h-0.5 w-5" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
        <button onClick={() => setTable((v) => !v)} className="text-xs font-medium uppercase tracking-[.16em] text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline">
          {table ? "Show chart" : "Show table"}
        </button>
      </div>

      {table ? (
        <div className="max-h-[300px] overflow-auto border border-gray-100">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">Revenue</th><th className="px-3 py-2 text-right">Ad spend</th><th className="px-3 py-2 text-right">Orders</th></tr>
            </thead>
            <tbody className="divide-y">
              {data.map((d) => (
                <tr key={d.date}><td className="px-3 py-2">{day(d.date)}</td><td className="px-3 py-2 text-right">{rs(d.revenue)}</td><td className="px-3 py-2 text-right">{rs(d.spend)}</td><td className="px-3 py-2 text-right">{d.orders}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Daily store revenue and ad spend">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#E5E7EB" strokeWidth={1} strokeDasharray={t ? "3 4" : undefined} />
                <text x={PAD.l - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6B7280">{short(t)}</text>
              </g>
            ))}
            {data.map((d, i) => i % labelEvery === 0 || i === data.length - 1 ? (
              <text key={d.date} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#6B7280">{day(d.date)}</text>
            ) : null)}
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#9CA3AF" strokeWidth={1} />}
            {SERIES.map((s) => (
              <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {hover != null && SERIES.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(data[hover][s.key])} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
            ))}
            {max === 1 && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="13" fill="#9CA3AF">No data for this period</text>}
          </svg>
          {h && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-[180px] border border-gray-200 bg-white p-3 text-xs shadow-lg"
              style={{ left: `${(x(hover!) / W) * 100}%`, transform: `translateX(${hover! > data.length / 2 ? "-105%" : "5%"})` }}
            >
              <p className="mb-2 font-semibold text-gray-900">{day(h.date)}</p>
              {SERIES.map((s) => (
                <p key={s.key} className="flex items-center justify-between gap-4 py-0.5 text-gray-700">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
                  <span className="font-medium text-gray-900">{rs(h[s.key])}</span>
                </p>
              ))}
              <p className="mt-1 flex justify-between border-t pt-1.5 text-gray-700"><span>Orders</span><span className="font-medium text-gray-900">{h.orders}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
