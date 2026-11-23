"use client";
import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deliveryGuideMessage, waTo } from "@/lib/delivery-guide";
import { CONFIRMED_EVENT } from "@/lib/confirm-event";

type Info = { order_number: string; customer_name: string; phone: string; message: string };

/** After a single order is confirmed: popup with the customer's delivery guide, ready to send on WhatsApp. */
export default function DeliveryGuidePopup() {
  const [info, setInfo] = useState<Info | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onConfirmed = async (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (!id) return;
      const { data: o } = await createClient()
        .from("orders")
        .select("order_number, customer_name, phone, total, order_items(product_name, quantity)")
        .eq("id", id)
        .maybeSingle();
      if (!o) return;
      const items = ((o.order_items || []) as { product_name: string; quantity: number }[]).map((i) => `${i.quantity}× ${i.product_name}`).join(", ");
      setCopied(false);
      setInfo({
        order_number: o.order_number,
        customer_name: o.customer_name,
        phone: o.phone,
        message: deliveryGuideMessage({ customer_name: o.customer_name, order_number: o.order_number, total: Number(o.total), items }),
      });
    };
    window.addEventListener(CONFIRMED_EVENT, onConfirmed);
    return () => window.removeEventListener(CONFIRMED_EVENT, onConfirmed);
  }, []);

  if (!info) return null;
  const close = () => setInfo(null);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={close} role="presentation">
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Send delivery guide" className="flex max-h-[92svh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-md">
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <p className="flex items-center gap-2 font-bold"><ShieldCheck className="h-5 w-5 text-emerald-600" /> {info.order_number} confirmed</p>
            <p className="mt-0.5 text-sm text-gray-500">Send {info.customer_name.split(" ")[0]} the delivery guide so the parcel isn't refused at the door.</p>
          </div>
          <button onClick={close} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-900"><X className="h-5 w-5" /></button>
        </div>
        <pre className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap bg-[#ECE5DD] px-5 py-4 font-sans text-[13px] leading-relaxed text-gray-900">{info.message}</pre>
        <div className="flex flex-wrap gap-2 border-t px-5 py-3">
          <a
            href={`https://wa.me/${waTo(info.phone)}?text=${encodeURIComponent(info.message)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setTimeout(close, 300)}
            className="inline-flex flex-1 items-center justify-center gap-2 bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
          >
            <MessageCircle className="h-4 w-4" /> Send on WhatsApp
          </a>
          <button
            onClick={() => navigator.clipboard?.writeText(info.message).then(() => setCopied(true))}
            className="inline-flex items-center gap-1.5 border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 hover:border-gray-500"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={close} className="px-3 py-3 text-sm font-semibold text-gray-500 hover:text-gray-900">Skip</button>
        </div>
      </div>
    </div>
  );
}
