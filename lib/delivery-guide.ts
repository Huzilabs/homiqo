import { DELIVERY_GUIDE_URL, STORE } from "./config";
import { formatPrice } from "./format";

/** Customer-facing number for delivery problems, e.g. "0305 4471454". */
export const helpline = () => STORE.phone.replace(/^\+92\s?/, "0");

/**
 * WhatsApp message sent to every customer after ordering: delivery is free, pay only the COD amount,
 * open the parcel, and call us instead of refusing if the rider asks for extra money / advance.
 */
export function deliveryGuideMessage(o: { customer_name: string; order_number: string; total: number; items?: string }) {
  const first = o.customer_name.trim().split(/\s+/)[0] || "";
  const amount = formatPrice(Number(o.total));
  return [
    `Assalam o Alaikum ${first}! 🙏`,
    `Homiqo se aapka order *${o.order_number}* confirm ho gaya hai ✅`,
    o.items ? `📦 ${o.items}` : null,
    `💵 Cash on Delivery: *${amount}*`,
    `🚚 Delivery bilkul *FREE* hai — delivery charges hum pehle hi courier ko de chuke hain.`,
    ``,
    `*Rider aaye to yeh yaad rakhein:*`,
    `✅ Sirf *${amount}* dene hain — is se zyada ek rupay bhi nahi`,
    `✅ Parcel khol kar check karein, phir payment karein`,
    `❌ Rider extra paise, delivery charges ya advance maange to *bilkul na dein*`,
    `❌ Parcel *wapas na karein* — koi bhi masla ho to pehle humein call / WhatsApp karein: *${helpline()}*`,
    ``,
    `Aap ka parcel 2–5 working days mein pohanch jayega.`,
    DELIVERY_GUIDE_URL ? `🎥 Is video mein sab samjhaya hai: ${DELIVERY_GUIDE_URL}` : null,
    `Shukriya! — Team Homiqo`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export const waTo = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("92") ? d : d.startsWith("0") ? "92" + d.slice(1) : d.length === 10 ? "92" + d : d;
};
