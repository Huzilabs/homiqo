/** Shared admin reporting periods, computed in Pakistan time (UTC+5). */
export const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "lastmonth", label: "Last month" },
  { key: "90d", label: "Last 90 days" },
] as const;

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);
const pkToday = () => new Date(Date.now() + 5 * 3600e3);

export function resolveRange(key: string) {
  const t = pkToday();
  switch (key) {
    case "today": return { since: iso(t), until: iso(t) };
    case "yesterday": return { since: iso(addDays(t, -1)), until: iso(addDays(t, -1)) };
    case "30d": return { since: iso(addDays(t, -29)), until: iso(t) };
    case "90d": return { since: iso(addDays(t, -89)), until: iso(t) };
    case "month": return { since: iso(new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1))), until: iso(t) };
    case "lastmonth": {
      const first = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1));
      const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0));
      return { since: iso(first), until: iso(last) };
    }
    default: return { since: iso(addDays(t, -6)), until: iso(t) };
  }
}

/** Timestamp bounds for a [since, until] range of Pakistan calendar days. */
export const pkBounds = (since: string, until: string) => ({
  from: `${since}T00:00:00+05:00`,
  to: `${iso(addDays(new Date(until + "T00:00:00Z"), 1))}T00:00:00+05:00`,
});

export function eachDay(since: string, until: string) {
  const out: string[] = [];
  for (let d = new Date(since + "T00:00:00Z"); iso(d) <= until; d = addDays(d, 1)) out.push(iso(d));
  return out;
}
