import Link from "next/link";
import { RANGES } from "@/lib/date-range";

export default function RangeFilter({ base, active }: { base: string; active: string }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
      {RANGES.map((r) => (
        <Link
          key={r.key}
          href={`${base}?range=${r.key}`}
          className={`whitespace-nowrap border px-3.5 py-1.5 text-sm font-medium ${active === r.key ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
