import Link from "next/link";
import OrderFilters from "@/components/admin/OrderFilters";
import OrderBadges from "@/components/admin/OrderBadges";
import CallStatusSelect from "@/components/admin/CallStatusSelect";
import { CALL_STATUSES, showsCallStatus } from "@/lib/call-status";
import { Suspense } from "react";
import { MessageCircle, Phone, Truck } from "lucide-react";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import OrdersBoard, { type BoardOrder } from "@/components/admin/OrdersBoard";
import PostExSyncButton from "@/components/admin/PostExSyncButton";
import CreateOrderButton from "@/components/admin/CreateOrderButton";
import { BulkBar, OrdersSelection, RowCheckbox, SelectAll } from "@/components/admin/OrdersBulk";
import { adminProducts } from "@/lib/admin-products";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

const PAGE_SIZES = [25, 50, 100] as const;

const TILE: Record<string, { label: string; dot: string }> = {
  all: { label: "All orders", dot: "bg-ink" },
  pending: { label: "Pending", dot: "bg-amber-500" },
  confirmed: { label: "Confirmed", dot: "bg-blue-500" },
  shipped: { label: "Shipped", dot: "bg-purple-500" },
  delivered: { label: "Delivered", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", dot: "bg-rose-500" },
};

const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? "92" + d.slice(1) : d;
};

const when = (iso: string) => {
  const d = new Date(iso);
  const opts = { timeZone: "Asia/Karachi" } as const;
  return {
    date: d.toLocaleDateString("en-GB", { ...opts, day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-US", { ...opts, hour: "numeric", minute: "2-digit" }).toLowerCase(),
  };
};

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; view?: string; per?: string; call?: string; src?: string; product?: string; when?: string }>;
}) {
  const { status, q, page: pageParam, view, per: perParam, call, src: srcParam, product: productParam, when: whenParam } = await searchParams;
  const callKey = CALL_STATUSES.some((c) => c.key === call) ? call : undefined;
  const PAGE_SIZE = (PAGE_SIZES as readonly number[]).includes(Number(perParam)) ? Number(perParam) : 25;
  const board = view === "board";
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();

  const productsForForm = adminProducts(supabase);
  const allProducts = await productsForForm;
  const src = ["website", "whatsapp", "abandoned", "meta", "problems", "unconfirmed"].includes(srcParam || "") ? srcParam : undefined;
  const productId = allProducts.some((p) => p.id === productParam) ? productParam : undefined;
  // date ranges in Pakistan time (UTC+5)
  const PK = 5 * 3600e3;
  const pkMidnight = (daysAgo: number) => {
    const d = new Date(Date.now() + PK);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysAgo) - PK).toISOString();
  };
  const dateKey = ["today", "yesterday", "7d", "30d"].includes(whenParam || "") ? whenParam : undefined;
  const range: [string, string | null] | null =
    dateKey === "today" ? [pkMidnight(0), null] : dateKey === "yesterday" ? [pkMidnight(1), pkMidnight(0)] : dateKey === "7d" ? [pkMidnight(6), null] : dateKey === "30d" ? [pkMidnight(29), null] : null;
  // source / product filters apply to the list, the board and the status counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = (qb: any) => {
    if (src === "meta") qb = qb.gt("offer_discount", 0);
    else if (src === "problems") qb = qb.not("postex_attempt_reason", "is", null).in("status", ["confirmed", "shipped"]).not("postex_status", "ilike", "return*").not("postex_status", "ilike", "delivered*");
    else if (src === "unconfirmed") qb = qb.eq("status", "pending").is("customer_response", null);
    else if (src) qb = qb.eq("source", src);
    if (productId) qb = qb.eq("order_items.product_id", productId);
    if (range) {
      qb = qb.gte("created_at", range[0]);
      if (range[1]) qb = qb.lt("created_at", range[1]);
    }
    return qb;
  };
  const sel = (cols: string) => (productId ? `${cols}, order_items!inner(product_id)` : cols);

  let query = filtered(supabase.from("orders").select(sel("*"), { count: "exact" }).order("created_at", { ascending: false }));
  if (!board && status && (ORDER_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (!board && callKey) query = query.eq("call_status", callKey).in("status", ["pending", "confirmed"]);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone.ilike.%${term}%,city.ilike.%${term}%`);
  }

  const [{ count: todayCount }, { data: callRows }, { data, count }, ...statusCounts] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", pkMidnight(0)),
    supabase.from("orders").select("call_status").not("call_status", "is", null).in("status", ["pending", "confirmed"]),
    board ? query.limit(300) : query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    filtered(supabase.from("orders").select(sel("id"), { count: "exact", head: true })),
    ...ORDER_STATUSES.map((s) => filtered(supabase.from("orders").select(sel("id"), { count: "exact", head: true }).eq("status", s))),
  ]);
  const counts: Record<string, number> = { all: statusCounts[0].count || 0 };
  ORDER_STATUSES.forEach((s, i) => (counts[s] = statusCounts[i + 1].count || 0));

  const callCounts: Record<string, number> = {};
  for (const r of (callRows || []) as { call_status: string }[]) callCounts[r.call_status] = (callCounts[r.call_status] || 0) + 1;
  const orders = (data || []) as Order[];
  // risk flags for the orders on this page
  const { data: riskRows } = orders.length ? await supabase.rpc("order_risk_flags", { p_ids: orders.map((o) => o.id) }) : { data: [] };
  const risk = new Map(((riskRows || []) as { order_id: string; flags: string[] }[]).map((r) => [r.order_id, r.flags]));
  const pages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  const { data: itemRows } = orders.length
    ? await supabase.from("order_items").select("order_id, product_name, quantity").in("order_id", orders.map((o) => o.id))
    : { data: [] };
  const items = new Map<string, { name: string; qty: number }[]>();
  for (const r of (itemRows || []) as { order_id: string; product_name: string; quantity: number }[]) {
    items.set(r.order_id, [...(items.get(r.order_id) || []), { name: r.product_name, qty: r.quantity }]);
  }

  const href = (o: { status?: string; page?: number; per?: number; call?: string }) => {
    const sp = new URLSearchParams();
    if (board) sp.set("view", "board");
    const s = "status" in o ? o.status : status;
    if (s) sp.set("status", s);
    if (q) sp.set("q", q);
    const c = "call" in o ? o.call : callKey;
    if (c) sp.set("call", c);
    if (src) sp.set("src", src);
    if (dateKey) sp.set("when", dateKey);
    if (productId) sp.set("product", productId);
    const per = o.per ?? PAGE_SIZE;
    if (per !== 25) sp.set("per", String(per));
    if (o.page && o.page > 1) sp.set("page", String(o.page));
    const str = sp.toString();
    return `/admin/orders${str ? `?${str}` : ""}`;
  };

  const activeKey = status && TILE[status] ? status : "all";

  const tabs = ["all", ...ORDER_STATUSES] as string[];
  const itemsLabel = (its: { name: string; qty: number }[]) => {
    const n = its.reduce((a, i) => a + i.qty, 0);
    return { count: `${n} item${n === 1 ? "" : "s"}`, names: its.map((i) => `${i.qty}× ${i.name}`).join(", ") };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Orders</h1>
          <p className="text-[13px] text-gray-500">
            {counts.pending > 0 ? `${counts.pending} waiting for a confirmation call` : "All caught up — no pending orders"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white text-[13px] font-medium shadow-sm">
            <Link href={`/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={`px-3 py-1.5 ${board ? "text-gray-600 hover:bg-gray-50" : "bg-gray-900 text-white"}`}>List</Link>
            <Link href={`/admin/orders?view=board${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`px-3 py-1.5 ${board ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Board</Link>
          </div>
          <PostExSyncButton />
          <CreateOrderButton products={allProducts} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* status tabs */}
        {!board && (
          <nav className="flex overflow-x-auto border-b border-gray-200 px-2" aria-label="Order status">
            {tabs.map((k) => (
              <Link
                key={k}
                href={href({ status: k === "all" ? undefined : k, page: 1 })}
                className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-[13px] font-medium transition ${
                  activeKey === k ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {k !== "all" && <span className={`h-1.5 w-1.5 rounded-full ${TILE[k].dot}`} />}
                {TILE[k].label}
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${activeKey === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>{counts[k]}</span>
              </Link>
            ))}
          </nav>
        )}

        <Suspense fallback={<div className="h-[104px]" />}>
          <OrderFilters products={allProducts.map((p) => ({ id: p.id, name: p.name }))} todayCount={todayCount || 0} />
        </Suspense>

        {/* website-only call labels (never sent to PostEx) — tap to filter */}
        {!board && Object.keys(callCounts).length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 px-3 pb-3 text-xs sm:px-4">
            <span className="shrink-0 font-medium text-gray-500">Calls</span>
            {CALL_STATUSES.filter((c) => callCounts[c.key]).map((c) => (
              <Link
                key={c.key}
                href={href({ call: callKey === c.key ? undefined : c.key, page: 1 })}
                className={`shrink-0 rounded-md px-2 py-1 font-medium ring-1 ring-inset ${callKey === c.key ? "bg-gray-900 text-white ring-gray-900" : c.style}`}
              >
                {c.emoji} {c.label} · {callCounts[c.key]}
              </Link>
            ))}
            {callKey && <Link href={href({ call: undefined, page: 1 })} className="shrink-0 px-1 font-medium text-gray-500 underline">Clear</Link>}
          </div>
        )}

        {!board && (
        <OrdersSelection>
        {/* Desktop table */}
        <div className="hidden overflow-auto lg:block lg:max-h-[calc(100svh-5rem)]">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="w-10 py-2.5 pl-4"><SelectAll ids={orders.map((o) => o.id)} /></th>
                <th className="px-3 py-2.5 font-medium">Order</th>
                <th className="px-3 py-2.5 font-medium">Customer</th>
                <th className="px-3 py-2.5 text-right font-medium">Total</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Items</th>
                <th className="px-3 py-2.5 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => {
                const t = when(o.created_at);
                const it = itemsLabel(items.get(o.id) || []);
                return (
                  <tr key={o.id} className="align-middle transition hover:bg-gray-50">
                    <td className="py-2.5 pl-4"><RowCheckbox id={o.id} label={o.order_number} /></td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-gray-900 hover:underline">{o.order_number}</Link>
                      {Number(o.offer_discount || 0) > 0 && <span className="ml-1.5 align-middle text-[11px]" title="Meta offer">⚡</span>}
                      {o.source === "whatsapp" && <span className="ml-1 align-middle text-[11px]" title="WhatsApp order">💬</span>}
                      <p className="text-xs text-gray-500">{t.date}, {t.time}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[160px] truncate font-medium text-gray-900">{o.customer_name}</span>
                        <a href={`tel:${o.phone}`} aria-label={`Call ${o.phone}`} title={o.phone} className="text-gray-400 hover:text-gray-900"><Phone className="h-3.5 w-3.5" /></a>
                        <a href={`https://wa.me/${waNumber(o.phone)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-gray-400 hover:text-emerald-600"><MessageCircle className="h-3.5 w-3.5" /></a>
                      </div>
                      <p className="text-xs text-gray-500"><a href={`tel:${o.phone}`} className="tabular-nums text-gray-700 hover:underline">{o.phone}</a> · {o.city}</p>
                      <OrderBadges o={o} flags={risk.get(o.id)} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums text-gray-900">
                      {formatPrice(o.total)}
                      {o.payment_method === "bank_transfer" && <span className="block text-[10px] font-medium text-violet-700">Bank</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col items-start gap-1">
                        <OrderStatusSelect id={o.id} orderNumber={o.order_number} status={o.status} courier={o.courier} trackingNumber={o.tracking_number} />
                        {showsCallStatus(o.status) && <CallStatusSelect key={`${o.id}-${o.call_status}`} id={o.id} value={o.call_status} attempts={o.call_attempts} />}
                      </div>
                    </td>
                    <td className="max-w-[190px] px-3 py-2.5">
                      <p className="text-gray-900">{it.count}</p>
                      <p className="truncate text-xs text-gray-500" title={it.names}>{it.names}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs"><CourierCell o={o} /></td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-gray-500">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / tablet list */}
        <div className="lg:hidden">
          {orders.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2.5 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-[13px] text-gray-600">
              <SelectAll ids={orders.map((o) => o.id)} /> Select all {orders.length} on this page
            </label>
          )}
          <ul className="divide-y divide-gray-100">
            {orders.map((o) => {
              const t = when(o.created_at);
              const it = itemsLabel(items.get(o.id) || []);
              return (
                <li key={o.id} className="flex gap-3 px-4 py-3">
                  <span className="pt-0.5"><RowCheckbox id={o.id} label={o.order_number} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link href={`/admin/orders/${o.id}`} className="text-[15px] font-semibold text-gray-900">
                        {o.order_number}
                        {Number(o.offer_discount || 0) > 0 && <span className="ml-1 text-xs">⚡</span>}
                        {o.source === "whatsapp" && <span className="ml-1 text-xs">💬</span>}
                      </Link>
                      <span className="text-[15px] font-semibold tabular-nums text-gray-900">{formatPrice(o.total)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-[13px] text-gray-500">
                      <span className="truncate">{o.customer_name} · <a href={`tel:${o.phone}`} className="tabular-nums">{o.phone}</a> · {o.city}</span>
                      <span className="shrink-0">{t.date}, {t.time}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{it.names}</p>
                    <OrderBadges o={o} flags={risk.get(o.id)} />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <OrderStatusSelect id={o.id} orderNumber={o.order_number} status={o.status} courier={o.courier} trackingNumber={o.tracking_number} />
                        {showsCallStatus(o.status) && <CallStatusSelect key={`${o.id}-${o.call_status}`} id={o.id} value={o.call_status} attempts={o.call_attempts} />}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <a href={`tel:${o.phone}`} aria-label="Call" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600"><Phone className="h-4 w-4" /></a>
                        <a href={`https://wa.me/${waNumber(o.phone)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-emerald-600"><MessageCircle className="h-4 w-4" /></a>
                      </span>
                    </div>
                    {o.tracking_number && <div className="mt-1.5 text-xs"><CourierCell o={o} /></div>}
                  </div>
                </li>
              );
            })}
          </ul>
          {orders.length === 0 && <p className="p-10 text-center text-gray-500">No orders found.</p>}
        </div>

        <BulkBar orders={orders.map((o) => ({ id: o.id, order_number: o.order_number, status: o.status, booked: o.courier === "PostEx" && !!o.tracking_number }))} />
        </OrdersSelection>
        )}
      </div>

      {board && (
        <OrdersBoard
          orders={orders.map<BoardOrder>((o) => ({
            id: o.id, order_number: o.order_number, customer_name: o.customer_name, city: o.city, phone: o.phone, status: o.status,
            total: Number(o.total), payment_method: o.payment_method, courier: o.courier, tracking_number: o.tracking_number,
            postex_status: o.postex_status ?? null, call_status: o.call_status ?? null, call_attempts: o.call_attempts ?? 0, created_at: o.created_at, items: items.get(o.id) || [],
          }))}
        />
      )}

      {!board && (count || 0) > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-20 text-sm">
          <p className="text-gray-500">
            Showing <b className="text-ink">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, count || 0)}</b> of <b className="text-ink">{count}</b> orders
          </p>
          {pages > 1 && (
            <nav className="flex items-center gap-1" aria-label="Pages">
              <PageLink href={href({ page: page - 1 })} disabled={page <= 1} label="‹ Prev" />
              {pageList(page, pages).map((n, i) =>
                n === 0 ? <span key={`gap${i}`} className="px-1 text-gray-400">…</span> : <PageLink key={n} href={href({ page: n })} label={String(n)} active={n === page} />,
              )}
              <PageLink href={href({ page: page + 1 })} disabled={page >= pages} label="Next ›" />
            </nav>
          )}
          <p className="flex items-center gap-1 text-gray-500">
            Per page:
            {PAGE_SIZES.map((n) => (
              <Link key={n} href={href({ page: 1, per: n })} className={`px-2 py-1 ${n === PAGE_SIZE ? "bg-ink font-semibold text-white" : "hover:text-ink"}`}>{n}</Link>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

function CourierCell({ o }: { o: Order }) {
  if (o.courier === "PostEx" && o.tracking_number) {
    return (
      <span className="inline-flex flex-col">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-700"><Truck className="h-3 w-3" /> {o.tracking_number}</span>
        <span className="text-gray-500">{o.postex_status || "Booked"}</span>
      </span>
    );
  }
  if (o.courier) return <span className="text-gray-600">{o.courier}{o.tracking_number ? ` · ${o.tracking_number}` : ""}</span>;
  if (o.status === "pending") return <span className="font-medium text-amber-700">Call to approve</span>;
  return <span className="text-gray-400">—</span>;
}

/** 1 … 4 5 [6] 7 8 … 20 (0 = gap) */
function pageList(page: number, pages: number) {
  const out: number[] = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 2) out.push(n);
    else if (out[out.length - 1] !== 0) out.push(0);
  }
  return out;
}

function PageLink({ href, label, active, disabled }: { href: string; label: string; active?: boolean; disabled?: boolean }) {
  if (disabled) return <span className="px-3 py-1.5 text-gray-300">{label}</span>;
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`min-w-[2.25rem] border px-3 py-1.5 text-center ${active ? "border-ink bg-ink font-semibold text-white" : "border-ink/10 bg-white hover:border-ink/40"}`}>
      {label}
    </Link>
  );
}
