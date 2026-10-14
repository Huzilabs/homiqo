import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle, Phone } from "lucide-react";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
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
  const digits = o.phone.replace(/\D/g, "");
  const waNumber = digits.startsWith("0") ? "92" + digits.slice(1) : digits;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-ink print:hidden">
        <ChevronLeft className="h-4 w-4" /> All orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold">{o.order_number} <StatusBadge status={o.status} /></h1>
          <p className="text-sm text-gray-500">Placed {formatDate(o.created_at)}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <a href={`tel:${o.phone}`} className="btn-secondary px-4 py-2"><Phone className="h-4 w-4" /> Call</a>
          <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Assalam o Alaikum ${o.customer_name}, regarding your order ${o.order_number}`)}`} target="_blank" rel="noopener noreferrer" className="btn-secondary px-4 py-2">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
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
              <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd>{formatPrice(o.shipping_fee)}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total to collect (COD)</dt><dd>{formatPrice(o.total)}</dd></div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="font-bold">Customer</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{o.customer_name}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{o.phone}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{o.email || "—"}</dd></div>
              <div><dt className="text-gray-500">City</dt><dd className="font-medium">{o.city}</dd></div>
              <div className="sm:col-span-2"><dt className="text-gray-500">Address</dt><dd className="font-medium">{o.address}</dd></div>
              {o.notes && <div className="sm:col-span-2"><dt className="text-gray-500">Notes</dt><dd className="whitespace-pre-line font-medium">{o.notes}</dd></div>}
            </dl>
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <OrderStatusForm order={o} />
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
