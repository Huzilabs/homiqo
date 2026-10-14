import Link from "next/link";
import { AlertTriangle, Banknote, Clock, Package, ShoppingCart } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order, Product } from "@/lib/types";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [{ data: orders }, { data: recent }, { data: products }] = await Promise.all([
    supabase.from("orders").select("status,total,created_at").gte("created_at", since),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("products").select("id,name,stock,is_active").order("stock"),
  ]);

  const list = (orders || []) as Pick<Order, "status" | "total" | "created_at">[];
  const valid = list.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
  const delivered = list.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
  const pending = list.filter((o) => o.status === "pending").length;
  const lowStock = ((products || []) as Pick<Product, "id" | "name" | "stock" | "is_active">[]).filter((p) => p.is_active && p.stock <= 5);

  // last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const perDay = days.map((d) => {
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const dayOrders = valid.filter((o) => new Date(o.created_at) >= d && new Date(o.created_at) < next);
    return { d, count: dayOrders.length, total: dayOrders.reduce((s, o) => s + Number(o.total), 0) };
  });
  const maxDay = Math.max(1, ...perDay.map((p) => p.total));

  const stats = [
    { label: "Orders (30 days)", value: valid.length.toString(), icon: ShoppingCart },
    { label: "Sales (30 days)", value: formatPrice(revenue), icon: Banknote },
    { label: "Delivered value", value: formatPrice(delivered), icon: Package },
    { label: "Awaiting confirmation", value: pending.toString(), icon: Clock, href: "/admin/orders?status=pending" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => {
          const body = (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></div>
              <p className="mt-3 text-xs text-gray-500 sm:text-sm">{label}</p>
              <p className="text-xl font-extrabold sm:text-2xl">{value}</p>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="card p-5 hover:shadow-lift">{body}</Link>
          ) : (
            <div key={label} className="card p-5">{body}</div>
          );
        })}
      </div>

      <div className="card p-5">
        <p className="font-bold">Sales — last 14 days</p>
        <div className="mt-5 flex h-40 items-end gap-1.5 sm:gap-2">
          {perDay.map((p) => (
            <div key={p.d.toISOString()} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="w-full rounded-t-md bg-brand-500 transition group-hover:bg-brand-600"
                style={{ height: `${Math.max(2, (p.total / maxDay) * 100)}%`, opacity: p.total ? 1 : 0.25 }}
              />
              <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] text-white group-hover:block">
                {p.count} · {formatPrice(p.total)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-gray-400">
          <span>{days[0].toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>
          <span>Today</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b p-5">
            <p className="font-bold">Recent orders</p>
            <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
          </div>
          <ul className="divide-y">
            {((recent || []) as Order[]).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{o.order_number} <span className="font-normal text-gray-500">· {o.customer_name}</span></p>
                    <p className="text-xs text-gray-500">{formatDate(o.created_at)} · {o.city}</p>
                  </div>
                  <StatusBadge status={o.status} />
                  <p className="w-24 text-right text-sm font-semibold">{formatPrice(o.total)}</p>
                </Link>
              </li>
            ))}
            {!recent?.length && <li className="p-8 text-center text-sm text-gray-500">No orders yet.</li>}
          </ul>
        </div>
        <div className="card h-fit p-5">
          <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock</p>
          <ul className="mt-3 space-y-2 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <Link href={`/admin/products/${p.id}`} className="truncate hover:text-brand-700">{p.name}</Link>
                <span className={`font-semibold ${p.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>{p.stock}</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="text-gray-500">All products are well stocked.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
