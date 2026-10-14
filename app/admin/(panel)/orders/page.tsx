import Link from "next/link";
import { Search } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "@/lib/config";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

const PAGE_SIZE = 25;

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();

  let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone.ilike.%${term}%,city.ilike.%${term}%`);
  }
  const { data, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const orders = (data || []) as Order[];
  const pages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  const href = (o: { status?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const s = "status" in o ? o.status : status;
    if (s) sp.set("status", s);
    if (q) sp.set("q", q);
    if (o.page && o.page > 1) sp.set("page", String(o.page));
    const str = sp.toString();
    return `/admin/orders${str ? `?${str}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Orders <span className="text-base font-medium text-gray-400">({count || 0})</span></h1>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {[undefined, ...ORDER_STATUSES].map((s) => (
            <Link
              key={s || "all"}
              href={href({ status: s })}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
                status === s || (!status && !s) ? "bg-ink text-white" : "border bg-white text-gray-700"
              }`}
            >
              {s || "All"}
            </Link>
          ))}
        </div>
        <form className="relative md:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input name="q" defaultValue={q} placeholder="Order #, name, phone, city" className="input pl-9" />
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/admin/orders/${o.id}`} className="text-brand-700 hover:underline">{o.order_number}</Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-xs text-gray-500">{o.phone}</p>
                </td>
                <td className="px-4 py-3">{o.city}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-right font-semibold">{formatPrice(o.total)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-10 text-center text-gray-500">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={href({ page: page - 1 })} className="btn-secondary px-4 py-2">Previous</Link>}
          <span className="text-gray-500">Page {page} of {pages}</span>
          {page < pages && <Link href={href({ page: page + 1 })} className="btn-secondary px-4 py-2">Next</Link>}
        </div>
      )}
    </div>
  );
}
