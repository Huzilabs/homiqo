import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import BlockButton from "@/components/admin/BlockButton";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

type Row = { phone10: string; name: string; phone: string; city: string; orders: number; delivered: number; problems: number; open_orders: number; spent: number; first_at: string; last_at: string; blocked: boolean; block_reason: string | null };

const TABS = [
  { key: "all", label: "All" },
  { key: "repeat", label: "Repeat buyers" },
  { key: "problem", label: "Returned / refused" },
  { key: "blocked", label: "Blocked" },
] as const;

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" });
const wa = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("0") ? "92" + d.slice(1) : d; };

export default async function Customers({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const { tab: t, q } = await searchParams;
  const tab = TABS.some((x) => x.key === t) ? t! : "all";
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_customers");
  const all = ((data || []) as Row[]).sort((a, b) => +new Date(b.last_at) - +new Date(a.last_at));
  const counts = {
    all: all.length,
    repeat: all.filter((r) => r.orders > 1).length,
    problem: all.filter((r) => r.problems > 0).length,
    blocked: all.filter((r) => r.blocked).length,
  };
  const term = (q || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const digits = term.replace(/\D/g, "").slice(-10);
  const rows = all
    .filter((r) => tab === "all" || (tab === "repeat" && r.orders > 1) || (tab === "problem" && r.problems > 0) || (tab === "blocked" && r.blocked))
    .filter((r) => !term || r.name.toLowerCase().includes(term) || r.city.toLowerCase().includes(term) || (digits.length >= 4 && r.phone10.includes(digits)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Customers</h1>
        <p className="text-[13px] text-gray-500">Everyone who ordered, grouped by phone number. Blocked numbers get a red flag on new orders.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-gray-200 px-2">
          {TABS.map((x) => (
            <Link key={x.key} href={`/admin/customers${x.key === "all" ? "" : `?tab=${x.key}`}`} className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[13px] font-medium ${tab === x.key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
              {x.label}
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] ${tab === x.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>{counts[x.key]}</span>
            </Link>
          ))}
        </nav>
        <form className="p-3 sm:p-4">
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
          <input name="q" defaultValue={q || ""} placeholder="Search name, phone or city" className="h-9 w-full rounded-lg border border-gray-300 px-3 text-[13px] outline-none focus:border-gray-900" />
        </form>
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.phone10} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[13px] ${r.blocked ? "bg-rose-50/60" : ""}`}>
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold text-gray-900">
                  {r.name} {r.blocked && <span className="ml-1 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">BLOCKED</span>}
                </p>
                <p className="text-gray-500">{r.phone} · {r.city}</p>
                {r.blocked && r.block_reason && <p className="text-xs text-rose-700">Reason: {r.block_reason}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11.5px]">
                <span className="rounded bg-gray-100 px-2 py-1 text-gray-700">{r.orders} order{r.orders === 1 ? "" : "s"}</span>
                {r.delivered > 0 && <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">{r.delivered} delivered</span>}
                {r.problems > 0 && <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">{r.problems} returned / refused</span>}
                {r.open_orders > 0 && <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{r.open_orders} open</span>}
              </div>
              <div className="w-28 text-right">
                <p className="font-semibold tabular-nums text-gray-900">{formatPrice(Number(r.spent))}</p>
                <p className="text-[11px] text-gray-500">last {day(r.last_at)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Link href={`/admin/orders?q=${r.phone10}`} className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-gray-50">Orders</Link>
                <a href={`tel:${r.phone}`} aria-label="Call" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-50"><Phone className="h-4 w-4" /></a>
                <a href={`https://wa.me/${wa(r.phone)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rounded-md p-1.5 text-emerald-600 hover:bg-gray-50"><MessageCircle className="h-4 w-4" /></a>
                <BlockButton phone10={r.phone10} blocked={r.blocked} />
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="p-10 text-center text-gray-500">No customers found.</li>}
        </ul>
      </div>
    </div>
  );
}
