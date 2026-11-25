import Link from "next/link";
import OrderFilters from "@/components/admin/OrderFilters";
import CallStatusSelect from "@/components/admin/CallStatusSelect";
import { CALL_STATUSES, showsCallStatus } from "@/lib/call-status";
import { Suspense } from "react";
import { ChevronRight, MessageCircle, Phone, Truck } from "lucide-react";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import OrdersBoard, { type BoardOrder } from "@/components/admin/OrdersBoard";
import PostExSyncButton from "@/components/admin/PostExSyncButton";
import CreateOrderButton from "@/components/admin/CreateOrderButton";
import OrdersSearch from "@/components/admin/OrdersSearch";
import { BulkBar, OrdersSelection, RowCheckbox, SelectAll } from "@/components/admin/OrdersBulk";
import { adminProducts } from "@/lib/admin-products";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES } from "@/lib/config";
import { formatPrice, STATUS_ROW } from "@/lib/format";
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
  searchParams: Promise<{ status?: string; q?: string; page?: string; view?: string; per?: string; call?: string; src?: string; product?: string }>;
}) {
  const { status, q, page: pageParam, view, per: perParam, call, src: srcParam, product: productParam } = await searchParams;
  const callKey = CALL_STATUSES.some((c) => c.key === call) ? call : undefined;
  const PAGE_SIZE = (PAGE_SIZES as readonly number[]).includes(Number(perParam)) ? Number(perParam) : 25;
  const board = view === "board";
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();

  const productsForForm = adminProducts(supabase);
  const allProducts = await productsForForm;
  const src = ["website", "whatsapp", "abandoned", "meta"].includes(srcParam || "") ? srcParam : undefined;
  const productId = allProducts.some((p) => p.id === productParam) ? productParam : undefined;
  // source / product filters apply to the list, the board and the status counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = (qb: any) => {
    if (src === "meta") qb = qb.gt("offer_discount", 0);
    else if (src) qb = qb.eq("source", src);
    if (productId) qb = qb.eq("order_items.product_id", productId);
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

  const [{ data: callRows }, { data, count }, ...statusCounts] = await Promise.all([
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
    if (productId) sp.set("product", productId);
    const per = o.per ?? PAGE_SIZE;
    if (per !== 25) sp.set("per", String(per));
    if (o.page && o.page > 1) sp.set("page", String(o.page));
    const str = sp.toString();
    return `/admin/orders${str ? `?${str}` : ""}`;
  };

  const activeKey = status && TILE[status] ? status : "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            {counts.pending > 0 ? `${counts.pending} waiting for a confirmation call` : "All caught up — no pending orders"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-ink/15 bg-white text-xs font-semibold">
            <Link href={`/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`} className={`px-3 py-2 ${board ? "text-gray-500 hover:text-ink" : "bg-ink text-white"}`}>List</Link>
            <Link href={`/admin/orders?view=board${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`px-3 py-2 ${board ? "bg-ink text-white" : "text-gray-500 hover:text-ink"}`}>Board</Link>
          </div>
          <PostExSyncButton />
          <CreateOrderButton products={allProducts} />
        </div>
      </div>

      {/* Status tiles double as filters */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(["all", ...ORDER_STATUSES] as string[]).map((k) => (
          <Link
            key={k}
            href={href({ status: k === "all" ? undefined : k })}
            className={`border px-3 py-3 transition ${activeKey === k ? "border-ink bg-ink text-white" : "border-ink/10 bg-white hover:border-ink/40"}`}
          >
            <span className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider ${activeKey === k ? "text-white/70" : "text-gray-500"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${TILE[k].dot} ${activeKey === k ? "ring-1 ring-white/60" : ""}`} />
              {TILE[k].label}
            </span>
            <span className="mt-1 block text-xl font-bold tabular-nums">{counts[k]}</span>
          </Link>
        ))}
      </div>

      <Suspense fallback={null}>
        <OrderFilters products={allProducts.map((p) => ({ id: p.id, name: p.name }))} />
      </Suspense>

      {/* Website-only call follow-up labels (never sent to PostEx) — tap to filter */}
      {!board && Object.keys(callCounts).length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 text-xs sm:mx-0 sm:flex-wrap sm:px-0">
          <span className="shrink-0 self-center font-semibold uppercase tracking-wider text-gray-500">Calls:</span>
          {CALL_STATUSES.filter((c) => callCounts[c.key]).map((c) => (
            <Link
              key={c.key}
              href={href({ call: callKey === c.key ? undefined : c.key, page: 1 })}
              className={`shrink-0 rounded-full px-3 py-1.5 font-semibold ring-1 ring-inset ${callKey === c.key ? "bg-ink text-white ring-ink" : c.style}`}
            >
              {c.emoji} {c.label} · {callCounts[c.key]}
            </Link>
          ))}
          {callKey && <Link href={href({ call: undefined, page: 1 })} className="shrink-0 self-center px-2 font-semibold text-gray-500 underline">Clear</Link>}
        </div>
      )}

      <Suspense fallback={<div className="input h-11" />}>
        <OrdersSearch />
      </Suspense>

      {board ? (
        <OrdersBoard
          orders={orders.map<BoardOrder>((o) => ({
            id: o.id, order_number: o.order_number, customer_name: o.customer_name, city: o.city, phone: o.phone, status: o.status,
            total: Number(o.total), payment_method: o.payment_method, courier: o.courier, tracking_number: o.tracking_number,
            postex_status: o.postex_status ?? null, call_status: o.call_status ?? null, call_attempts: o.call_attempts ?? 0, created_at: o.created_at, items: items.get(o.id) || [],
          }))}
        />
      ) : (
      <OrdersSelection>
      {/* Desktop table */}
      <div className="card hidden overflow-auto lg:block lg:max-h-[calc(100svh-6rem)]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="w-10 py-3 pl-5"><SelectAll ids={orders.map((o) => o.id)} /></th>
              <th className="px-3 py-3 font-medium">Order</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Items</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Courier</th>
              <th className="px-3 py-3 text-right font-medium">Total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {orders.map((o) => {
              const t = when(o.created_at);
              const its = items.get(o.id) || [];
              return (
                <tr key={o.id} className={`align-top transition ${STATUS_ROW[o.status] || "hover:bg-gray-50/70"}`}>
                  <td className="py-4 pl-5"><RowCheckbox id={o.id} label={o.order_number} /></td>
                  <td className="px-3 py-4">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.order_number}</Link>
                    <p className="mt-0.5 text-xs text-gray-500">{t.date} · {t.time}</p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="font-medium">{o.customer_name}</p>
                    <p className="text-xs text-gray-500">{o.city}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs">
                      <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1 text-gray-600 hover:text-ink">
                        <Phone className="h-3 w-3" /> {o.phone}
                      </a>
                      <a href={`https://wa.me/${waNumber(o.phone)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-emerald-600 hover:text-emerald-700">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                  <td className="max-w-[220px] px-3 py-4 text-xs text-gray-600">
                    {its.slice(0, 2).map((i, n) => (
                      <p key={n} className="truncate"><span className="font-semibold text-ink">{i.qty}×</span> {i.name}</p>
                    ))}
                    {its.length > 2 && <p className="text-gray-400">+{its.length - 2} more</p>}
                  </td>
                  <td className="px-3 py-4">
                    <OrderStatusSelect id={o.id} orderNumber={o.order_number} status={o.status} courier={o.courier} trackingNumber={o.tracking_number} />
                    {showsCallStatus(o.status) && <div className="mt-1.5"><CallStatusSelect key={`${o.id}-${o.call_status}`} id={o.id} value={o.call_status} attempts={o.call_attempts} /></div>}
                  </td>
                  <td className="px-3 py-4 text-xs">
                    <CourierCell o={o} />
                  </td>
                  <td className="px-3 py-4 text-right font-semibold tabular-nums">
                    {formatPrice(o.total)}
                    <span className={`mt-0.5 block text-[10px] font-medium uppercase tracking-wider ${o.payment_method === "bank_transfer" ? "text-violet-700" : "text-gray-400"}`}>
                      {o.payment_method === "bank_transfer" ? "Bank transfer" : "COD"}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <Link href={`/admin/orders/${o.id}`} aria-label={`Open ${o.order_number}`} className="flex h-8 w-8 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-ink">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={8} className="p-12 text-center text-gray-500">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="space-y-3 lg:hidden">
        {orders.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2.5 border border-ink/10 bg-white px-4 py-3 text-sm font-medium">
            <SelectAll ids={orders.map((o) => o.id)} /> Select all {orders.length} orders on this page
          </label>
        )}
        {orders.map((o) => {
          const t = when(o.created_at);
          const its = items.get(o.id) || [];
          return (
            <div key={o.id} className={`card p-4 ${STATUS_ROW[o.status] || ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="pt-1"><RowCheckbox id={o.id} label={o.order_number} /></span>
                  <div>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700">{o.order_number}</Link>
                  <p className="text-xs text-gray-500">{t.date} · {t.time}</p>
                  </div>
                </div>
                <p className="text-right font-semibold tabular-nums">
                  {formatPrice(o.total)}
                  <span className={`block text-[10px] font-medium uppercase tracking-wider ${o.payment_method === "bank_transfer" ? "text-violet-700" : "text-gray-400"}`}>{o.payment_method === "bank_transfer" ? "Bank transfer" : "COD"}</span>
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.customer_name} <span className="font-normal text-gray-500">· {o.city}</span></p>
                  <p className="truncate text-xs text-gray-500">{its.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <a href={`tel:${o.phone}`} aria-label="Call" className="flex h-9 w-9 items-center justify-center border border-ink/10"><Phone className="h-4 w-4" /></a>
                  <a href={`https://wa.me/${waNumber(o.phone)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center border border-ink/10 text-emerald-600"><MessageCircle className="h-4 w-4" /></a>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/5 pt-3">
                <div className="flex flex-col items-start gap-1.5">
                  <OrderStatusSelect id={o.id} orderNumber={o.order_number} status={o.status} courier={o.courier} trackingNumber={o.tracking_number} />
                  {showsCallStatus(o.status) && <CallStatusSelect key={`${o.id}-${o.call_status}`} id={o.id} value={o.call_status} attempts={o.call_attempts} />}
                </div>
                <div className="text-right text-xs"><CourierCell o={o} /></div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="card p-10 text-center text-gray-500">No orders found.</p>}
      </div>

      <BulkBar orders={orders.map((o) => ({ id: o.id, order_number: o.order_number, status: o.status }))} />
      </OrdersSelection>
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
        <span className="inline-flex items-center gap-1 font-mono text-[11px]"><Truck className="h-3 w-3" /> {o.tracking_number}</span>
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
