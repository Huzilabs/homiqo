import { BANK, STORE } from "@/lib/config";
import { reviewLink } from "@/lib/reviews";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle, Phone, Star } from "lucide-react";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import PostExPanel from "@/components/admin/PostExPanel";
import PrintButton from "@/components/admin/PrintButton";
import StatusBadge from "@/components/admin/StatusBadge";
import ProductImage from "@/components/ProductImage";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, STATUS_LABEL } from "@/lib/format";
import type { Order, OrderEvent, OrderItem } from "@/lib/types";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: order }, { data: items }, { data: events }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("order_events").select("status,note,created_at").eq("order_id", id).order("created_at"),
  ]);
  if (!order) notFound();
  const o = order as Order;
  const { data: suggestedCity } = await supabase.rpc("postex_match_city", { p_city: o.city });
  const digits = o.phone.replace(/\D/g, "");
  const waNumber = digits.startsWith("0") ? "92" + digits.slice(1) : digits;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-ink print:hidden">
        <ChevronLeft className="h-4 w-4" /> All orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-extrabold">
            {o.order_number} <StatusBadge status={o.status} />
            {o.payment_method === "bank_transfer" && <span className="badge bg-violet-50 text-violet-700 ring-violet-600/20">Bank transfer</span>}
          </h1>
          {o.payment_method === "bank_transfer" && o.status === "pending" && (
            <p className="mt-1 text-sm font-medium text-violet-700">Check the payment screenshot on WhatsApp ({BANK.whatsappDisplay}) before confirming. PostEx will collect Rs 0 for this order.</p>
          )}
          <p className="text-sm text-gray-500">Placed {formatDate(o.created_at)}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <a href={`tel:${o.phone}`} className="btn-secondary px-4 py-2"><Phone className="h-4 w-4" /> Call</a>
          <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Assalam o Alaikum ${o.customer_name}, regarding your order ${o.order_number}`)}`} target="_blank" rel="noopener noreferrer" className="btn-secondary px-4 py-2">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          {o.status === "delivered" && (
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Assalam o Alaikum ${o.customer_name.split(" ")[0]}! Thank you for shopping with ${STORE.name}. We hope you're enjoying your order ${o.order_number}. Could you take a minute to leave a quick review? It really helps us: ${reviewLink(o.order_number, o.phone)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2"
            >
              <Star className="h-4 w-4" /> Ask for a review
            </a>
          )}
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-bold">Items</h2>
            <ul className="mt-4 divide-y">
              {((items || []) as OrderItem[]).map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    <ProductImage src={i.product_image} alt={i.product_name} sizes="56px" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{i.product_name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(i.unit_price)} × {i.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(i.line_total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatPrice(o.subtotal)}</dd></div>
              {Number(o.discount) > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount{[Number(o.offer_discount) > 0 && `Meta offer ${formatPrice(Number(o.offer_discount))}`, Number(o.bundle_discount) > 0 && `Buy 2 save ${formatPrice(Number(o.bundle_discount))}`, Number(o.combo_discount) > 0 && `Combo ${formatPrice(Number(o.combo_discount))}`].filter(Boolean).length ? ` (incl. ${[Number(o.offer_discount) > 0 && `Meta offer ${formatPrice(Number(o.offer_discount))}`, Number(o.bundle_discount) > 0 && `Buy 2 save ${formatPrice(Number(o.bundle_discount))}`, Number(o.combo_discount) > 0 && `Combo ${formatPrice(Number(o.combo_discount))}`].filter(Boolean).join(", ")})` : ""}</dt><dd>−{formatPrice(Number(o.discount))}</dd></div>}
              <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd>{formatPrice(o.shipping_fee)}</dd></div>
              {o.payment_method === "bank_transfer" ? (
                <div className="flex justify-between text-base font-bold"><dt>Total paid by bank transfer</dt><dd>{formatPrice(o.total)}</dd></div>
              ) : (
                <div className="flex justify-between text-base font-bold"><dt>Total to collect (COD)</dt><dd>{formatPrice(o.total)}</dd></div>
              )}
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="font-bold">Customer</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{o.customer_name}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{o.phone}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{o.email || "—"}</dd></div>
              <div><dt className="text-gray-500">City</dt><dd className="font-medium">{o.city}</dd></div>
              <div><dt className="text-gray-500">Postal code</dt><dd className="font-medium">{o.postal_code || "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-gray-500">Address</dt><dd className="font-medium">{o.address}</dd></div>
              {o.notes && <div className="sm:col-span-2"><dt className="text-gray-500">Notes</dt><dd className="whitespace-pre-line font-medium">{o.notes}</dd></div>}
            </dl>
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <PostExPanel order={o} suggestedCity={(suggestedCity as string | null) ?? null} />
          <OrderStatusForm key={`${o.status}-${o.updated_at}`} order={o} />
          <div className="card p-6">
            <h2 className="font-bold">History</h2>
            <ol className="mt-4 space-y-3 border-l-2 border-gray-100 pl-4 text-sm">
              {((events || []) as OrderEvent[]).map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <p className="font-medium">{STATUS_LABEL[e.status]}{e.note && e.note !== STATUS_LABEL[e.status] ? ` — ${e.note}` : ""}</p>
                  <p className="text-xs text-gray-500">{formatDate(e.created_at)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
