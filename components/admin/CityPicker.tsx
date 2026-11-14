"use client";
import { useMemo, useState } from "react";

// Spelling-tolerant search over PostEx's city list (e.g. "kallur" → KALOR KOT, "dera gazi" → DERA GHAZI KHAN).
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, "");
// consonant skeleton: drop vowels/H/Y/W, collapse doubled letters ("KALLUR" → "KLR", "KALOR KOT" → "KLRKT")
const skel = (s: string) => norm(s).replace(/[AEIOUHYW]/g, "").replace(/(.)\1+/g, "$1");

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export function rankCities(q: string, cities: string[], limit = 8) {
  const nq = norm(q), sq = skel(q);
  if (!nq) return [];
  const scored: [number, string][] = [];
  for (const c of cities) {
    const nc = norm(c), sc = skel(c);
    const words = c.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
    let s: number | null = null;
    if (nc === nq) s = 0;
    else if (nc.startsWith(nq)) s = 1;
    else if (words.some((w) => w.startsWith(nq))) s = 2;
    else if (nc.includes(nq)) s = 3;
    else if (sq.length >= 2 && sc.startsWith(sq)) s = 4;
    else if (sq.length >= 2 && sc.includes(sq)) s = 5;
    else {
      const dist = Math.min(lev(nq, nc.slice(0, nq.length)), ...words.map((w) => lev(nq, w)));
      if (dist <= Math.max(1, Math.floor(nq.length / 4))) s = 6 + dist;
    }
    if (s !== null) scored.push([s * 1000 + nc.length, c]);
  }
  return scored.sort((a, b) => a[0] - b[0]).slice(0, limit).map((x) => x[1]);
}

export default function CityPicker({ value, onChange, cities, hint }: { value: string; onChange: (v: string) => void; cities: string[]; hint: string }) {
  const [open, setOpen] = useState(false);
  const query = value || hint;
  const matches = useMemo(() => rankCities(query, cities), [query, cities]);
  const exact = cities.some((c) => c.toUpperCase() === value.trim().toUpperCase());

  return (
    <div className="relative">
      <input
        id="postex-city"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="input"
        placeholder="Start typing…"
        autoComplete="off"
      />
      {open && !exact && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto border border-gray-200 bg-white shadow-lg">
          {matches.length ? (
            matches.map((c) => (
              <li key={c}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(c); setOpen(false); }}
                  className="block w-full px-4 py-2.5 text-left text-sm hover:bg-brand-50">
                  {c}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-2.5 text-sm text-gray-500">No similar city — try the nearest bigger town or the district name.</li>
          )}
        </ul>
      )}
      {!exact && !open && matches.length > 0 && (
        <p className="mt-1 text-xs text-gray-600">
          Did you mean{" "}
          {matches.slice(0, 3).map((c, i) => (
            <span key={c}>{i > 0 && ", "}<button type="button" onClick={() => onChange(c)} className="font-semibold text-brand-700 underline">{c}</button></span>
          ))}
          ?
        </p>
      )}
    </div>
  );
}
