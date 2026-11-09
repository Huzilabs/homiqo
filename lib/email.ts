import "server-only";
import nodemailer from "nodemailer";
import { STORE } from "./config";
import { formatPrice } from "./format";
import { reviewLink } from "./reviews";

export type OrderEmailKind = "received" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface EmailOrder {
  order_number: string;
  customer_name: string;
  email?: string | null;
  phone?: string;
  address?: string;
  city: string;
  postal_code?: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  courier?: string | null;
  tracking_number?: string | null;
  payment_method?: string;
  discount?: number;
  items: { product_name: string; quantity: number; unit_price: number; line_total: number; product_image?: string | null }[];
}

// Default sender: the store Gmail. Only SMTP_PASS (a Gmail App Password) has to be set; the rest can be overridden by env vars.
const SMTP_HOST = () => process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_USER = () => process.env.SMTP_USER || "homiqo.officialsite@gmail.com";

export const emailConfigured = () => Boolean(process.env.SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;
function getTransport() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: SMTP_HOST(),
      port,
      secure: port === 465,
      auth: { user: SMTP_USER(), pass: process.env.SMTP_PASS?.replace(/\s+/g, "") },
    });
  }
  return transporter;
}

/** Store owner inboxes: they receive the "new order received" alert only. Override with ADMIN_NOTIFY_EMAIL (comma-separated). */
export const adminRecipients = () =>
  (process.env.ADMIN_NOTIFY_EMAIL || "huzaifayaseen306@gmail.com,amirsohail1468@gmail.com")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

const from = () => process.env.SMTP_FROM || `${STORE.name} <${SMTP_USER()}>`;

const COPY: Record<OrderEmailKind, { subject: (n: string) => string; title: string; intro: string }> = {
  received: {
    subject: (n) => `We’ve received your order ${n}`,
    title: "Thank you for your order!",
    intro: "We’ve received your order and our team will confirm it shortly. You’ll pay in cash when it arrives.",
  },
  confirmed: {
    subject: (n) => `Your order ${n} is confirmed ✅`,
    title: "Your order is confirmed",
    intro: "Great news — your order has been confirmed and is being packed. We’ll let you know as soon as it ships.",
  },
  shipped: {
    subject: (n) => `Your order ${n} is on its way 🚚`,
    title: "Your order has shipped",
    intro: "Your parcel is on its way! Please keep the cash amount ready for the rider.",
  },
  delivered: {
    subject: (n) => `Your order ${n} has been delivered`,
    title: "Delivered — enjoy!",
    intro: "Your order has been delivered. We hope you love it. If anything isn’t right, just reply to this email within 7 days.",
  },
  cancelled: {
    subject: (n) => `Your order ${n} has been cancelled`,
    title: "Your order was cancelled",
    intro: "Your order has been cancelled. If you didn’t request this or have any questions, simply reply to this email.",
  },
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function render(kind: OrderEmailKind, o: EmailOrder) {
  const c = COPY[kind];
  const site = STORE.siteUrl.replace(/\/$/, "");
  const rows = o.items
    .map(
      (i) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #F0E6D8;font-size:14px;color:#10302E">${esc(i.product_name)} <span style="color:#8A8A8A">× ${i.quantity}</span></td>
        <td style="padding:12px 0;border-bottom:1px solid #F0E6D8;font-size:14px;color:#10302E;text-align:right;white-space:nowrap">${formatPrice(i.line_total)}</td>
      </tr>`,
    )
    .join("");
  // Tracking box on confirmed/shipped emails; PostEx parcels get a one-click tracking link
  const isPostEx = /postex/i.test(o.courier || "");
  const trackUrl = isPostEx && o.tracking_number ? `https://postex.pk/tracking?cn=${encodeURIComponent(o.tracking_number)}` : "";
  // Delivered: ask for a review (verified buyers only — the link carries the order number + phone)
  const reviewUrl = kind === "delivered" && o.phone ? reviewLink(o.order_number, o.phone) : "";
  const review = reviewUrl
    ? `<div style="margin:20px 0;padding:18px;border-radius:14px;background:#FFF4E6;font-size:14px;line-height:1.6;color:#10302E">
        <b>How did we do?</b><br>Your honest review helps other customers choose.
        <br><a href="${reviewUrl}" style="display:inline-block;margin-top:10px;padding:10px 18px;border-radius:999px;background:#E67A00;color:#ffffff;text-decoration:none;font-weight:600">★ Leave a review</a>
      </div>`
    : "";
  const shipping =
    (kind === "shipped" || kind === "confirmed") && o.tracking_number
      ? `<div style="margin:20px 0;padding:16px;border-radius:14px;background:#E8F3F2;font-size:14px;line-height:1.6;color:#0D5B58">
          ${o.courier ? `Courier: <b>${esc(o.courier)}</b><br>` : ""}Tracking number: <b>${esc(o.tracking_number)}</b>
          ${trackUrl ? `<br><a href="${trackUrl}" style="display:inline-block;margin-top:10px;padding:10px 18px;border-radius:999px;background:#0D5B58;color:#ffffff;text-decoration:none;font-weight:600">Track your parcel on PostEx</a>` : ""}
        </div>`
      : "";
  const html = `<!doctype html><html><body style="margin:0;background:#FFF4E6;font-family:Poppins,Segoe UI,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF4E6;padding:32px 12px"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden">
      <tr><td style="padding:28px 32px;border-bottom:1px solid #F0E6D8"><img src="${site}/logo.png" alt="${esc(STORE.name)}" height="40" style="display:block;height:40px"></td></tr>
      <tr><td style="padding:32px">
        <h1 style="margin:0 0 8px;font-size:24px;color:#0D5B58">${c.title}</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4A5A58">Hi ${esc(o.customer_name.split(" ")[0])}, ${c.intro}</p>
        <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:#FFF4E6;color:#C26700;font-weight:700;font-size:13px">Order ${esc(o.order_number)}</div>
        ${shipping}${review}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">${rows}
          <tr><td style="padding:10px 0 0;font-size:14px;color:#6B6B6B">Subtotal</td><td style="padding:10px 0 0;font-size:14px;text-align:right">${formatPrice(o.subtotal)}</td></tr>
          ${Number(o.discount) > 0 ? `<tr><td style="padding:6px 0;font-size:14px;color:#3B9468">Discount</td><td style="padding:6px 0;font-size:14px;color:#3B9468;text-align:right">−${formatPrice(Number(o.discount))}</td></tr>` : ""}
          <tr><td style="padding:6px 0;font-size:14px;color:#6B6B6B">Delivery</td><td style="padding:6px 0;font-size:14px;text-align:right">${Number(o.shipping_fee) === 0 ? "Free" : formatPrice(o.shipping_fee)}</td></tr>
          <tr><td style="padding:10px 0;font-size:16px;font-weight:700;color:#0D5B58">Total (${o.payment_method === "bank_transfer" ? "Bank Transfer" : "Cash on Delivery"})</td><td style="padding:10px 0;font-size:16px;font-weight:700;color:#0D5B58;text-align:right">${formatPrice(o.total)}</td></tr>
        </table>
        ${o.address ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6B6B6B"><b style="color:#10302E">Delivery address</b><br>${esc(o.address)}, ${esc(o.city)}</p>` : ""}
        <a href="${site}/shop" style="display:inline-block;margin-top:28px;padding:14px 28px;border-radius:999px;background:#FF8A00;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px">Continue shopping</a>
      </td></tr>
      <tr><td style="padding:20px 32px;background:#0D5B58;color:#CFE6E4;font-size:12px;line-height:1.6">
        Questions? Just reply to this email${STORE.phone ? ` or call ${esc(STORE.phone)}` : ""}.<br>© ${new Date().getFullYear()} ${esc(STORE.name)} · ${esc(site.replace(/^https?:\/\//, ""))}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
  const text = `${c.title}\n\nHi ${o.customer_name}, ${c.intro}\n\nOrder ${o.order_number}\n${o.items
    .map((i) => `- ${i.product_name} x${i.quantity}: ${formatPrice(i.line_total)}`)
    .join("\n")}\nTotal (${o.payment_method === "bank_transfer" ? "Bank Transfer" : "COD"}): ${formatPrice(o.total)}${
    shipping && o.tracking_number ? `\n\nTracking number: ${o.tracking_number}${trackUrl ? `\nTrack your parcel: ${trackUrl}` : ""}` : ""
  }\n\n${site}`;
  return { subject: c.subject(o.order_number), html, text };
}

/** Sends a customer email for an order event. Never throws — returns whether it was sent. */
export async function sendOrderEmail(kind: OrderEmailKind, order: EmailOrder): Promise<boolean> {
  // Status updates go to the customer only — the store owners just get the new-order alert.
  // CUSTOMER_EMAILS=off pauses customer emails entirely.
  if (process.env.CUSTOMER_EMAILS === "off") return false;
  if (!emailConfigured() || !order.email) return false;
  try {
    const { subject, html, text } = render(kind, order);
    await getTransport().sendMail({
      from: from(),
      to: order.email,
      replyTo: process.env.SMTP_REPLY_TO || STORE.email || undefined,
      subject,
      html,
      text,
    });
    return true;
  } catch (e) {
    console.error("sendOrderEmail failed", kind, order.order_number, e);
    return false;
  }
}

/** Alerts the store owner about a new order. */
export async function sendNewOrderAlert(order: EmailOrder) {
  const to = adminRecipients();
  if (!emailConfigured() || to.length === 0) return false;
  try {
    const site = STORE.siteUrl.replace(/\/$/, "");
    await getTransport().sendMail({
      from: from(),
      to,
      subject: `🛒 New order ${order.order_number} — ${formatPrice(order.total)}`,
      text: `New order ${order.order_number}\n\n${order.customer_name}\n${order.phone || ""}\n${order.email || ""}\n${order.address || ""}, ${order.city}${order.postal_code ? ` ${order.postal_code}` : ""}\n\n${order.items
        .map((i) => `- ${i.product_name} x${i.quantity}: ${formatPrice(i.line_total)}`)
        .join("\n")}\n\nTotal (${order.payment_method === "bank_transfer" ? "BANK TRANSFER — check WhatsApp for the screenshot" : "COD"}): ${formatPrice(order.total)}\n\nManage: ${site}/admin/orders`,
    });
    return true;
  } catch (e) {
    console.error("sendNewOrderAlert failed", e);
    return false;
  }
}

/** Admin check: verify the SMTP login and send a short test message to the owner inboxes. */
export async function sendTestEmail(): Promise<{ ok: boolean; from: string; to: string[]; error?: string }> {
  const to = adminRecipients();
  if (!emailConfigured()) return { ok: false, from: from(), to, error: "SMTP_PASS is not set" };
  try {
    const t = getTransport();
    await t.verify();
    await t.sendMail({
      from: from(),
      to,
      subject: `${STORE.name} — test email`,
      text: `This is a test from your ${STORE.name} website. If you can read this, order emails are being sent from ${SMTP_USER()} correctly.`,
    });
    return { ok: true, from: from(), to };
  } catch (e) {
    return { ok: false, from: from(), to, error: e instanceof Error ? e.message : String(e) };
  }
}
