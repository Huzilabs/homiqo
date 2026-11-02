"use client";
import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { BANK } from "@/lib/config";
import { formatPrice } from "@/lib/format";

/** Bank account details with copy buttons, plus a WhatsApp button to send the payment screenshot. */
export default function BankDetails({ amount, orderNumber }: { amount?: number; orderNumber?: string }) {
  const rows: [string, string, boolean][] = [
    ["Bank", BANK.bank, false],
    ["Account title", BANK.title, true],
    ["Account number", BANK.account, true],
    ["IBAN", BANK.iban, true],
    ["Branch", BANK.branch, false],
  ];
  const msg = orderNumber
    ? `Assalam o Alaikum, I have paid ${amount ? formatPrice(amount) : ""} by bank transfer for order ${orderNumber}. Screenshot attached.`
    : "Assalam o Alaikum, sharing my bank transfer screenshot.";
  return (
    <div className="border border-brand-600/20 bg-white">
      {amount !== undefined && (
        <div className="flex items-center justify-between gap-4 bg-brand-600 px-5 py-4 text-white">
          <span className="text-sm text-white/80">Amount to transfer</span>
          <span className="font-serif text-2xl">{formatPrice(amount)}</span>
        </div>
      )}
      <dl className="divide-y divide-ink/10 px-5">
        {rows.map(([label, value, copy]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-3 text-sm">
            <dt className="text-ink/55">{label}</dt>
            <dd className="flex items-center gap-2 text-right font-semibold tracking-wide text-ink">
              <span className="break-all">{value}</span>
              {copy && <CopyButton value={value} label={label} />}
            </dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-ink/10 p-5">
        <p className="text-sm text-ink/70">
          After paying, send the payment screenshot on WhatsApp to <b className="text-ink">{BANK.whatsappDisplay}</b>
          {orderNumber && <> with your order number <b className="text-ink">{orderNumber}</b></>}. We dispatch once the payment is confirmed.
        </p>
        <a
          href={`https://wa.me/${BANK.whatsapp}?text=${encodeURIComponent(msg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5b]"
        >
          <MessageCircle className="h-5 w-5" /> Send screenshot on WhatsApp
        </a>
      </div>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className="shrink-0 p-1 text-ink/40 transition hover:text-ink"
    >
      {done ? <Check className="h-4 w-4 text-leaf-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
