"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <select
      aria-label="Sort products"
      value={value}
      onChange={(e) => {
        const sp = new URLSearchParams(params.toString());
        if (e.target.value) sp.set("sort", e.target.value);
        else sp.delete("sort");
        router.push(`${pathname}?${sp.toString()}`);
      }}
      className="w-full border-0 border-b border-ink/20 bg-transparent py-1.5 pr-8 text-[11px] font-medium uppercase tracking-[.2em] outline-none focus:border-ink sm:w-56"
    >
      <option value="">Recommended</option>
      <option value="newest">Newest</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}
