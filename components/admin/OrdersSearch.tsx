"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";

/** Live search: results update while typing (no need to press Enter). */
export default function OrdersSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") || "");
  const [pending, setPending] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setPending(true);
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (value.trim()) sp.set("q", value.trim()); else sp.delete("q");
      sp.delete("page"); // new search starts at page 1
      router.replace(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
      setPending(false);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search order #, customer name, phone or city"
        className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-9 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        aria-label="Search orders"
      />
      {pending ? (
        <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
      ) : value ? (
        <button type="button" onClick={() => setValue("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-ink"><X className="h-4 w-4" /></button>
      ) : null}
    </div>
  );
}
