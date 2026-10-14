import { ChevronDown } from "lucide-react";

export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      {items.map(({ q, a }) => (
        <details key={q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
            {q}
            <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 text-gray-600">{a}</p>
        </details>
      ))}
    </div>
  );
}
