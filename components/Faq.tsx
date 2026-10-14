import { Plus } from "lucide-react";

export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="border-t border-ink/15">
      {items.map(({ q, a }) => (
        <details key={q} className="group border-b border-ink/15">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-serif text-xl text-ink transition hover:text-brand-600 sm:text-2xl [&::-webkit-details-marker]:hidden">
            {q}
            <Plus className="h-5 w-5 shrink-0 transition duration-300 group-open:rotate-45" strokeWidth={1.25} />
          </summary>
          <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-ink/65">{a}</p>
        </details>
      ))}
    </div>
  );
}
