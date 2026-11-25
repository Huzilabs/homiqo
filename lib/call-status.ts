/** Website-only follow-up labels for the confirmation call. Never sent to PostEx; the order status stays as it is. */
export const CALL_STATUSES = [
  { key: "no_answer", label: "Call not attended", emoji: "📵", style: "bg-orange-100 text-orange-800 ring-orange-400/50", attempt: true },
  { key: "whatsapp_sent", label: "Messaged on WhatsApp", emoji: "💬", style: "bg-emerald-100 text-emerald-800 ring-emerald-400/50", attempt: false },
  { key: "address_pending", label: "Waiting for address", emoji: "📍", style: "bg-sky-100 text-sky-800 ring-sky-400/50", attempt: false },
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number]["key"];
export const callStatus = (key?: string | null) => CALL_STATUSES.find((c) => c.key === key);
/** Only orders still being confirmed/delivered get a call label. */
export const showsCallStatus = (status: string) => status === "pending" || status === "confirmed";
