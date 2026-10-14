import "server-only";
import nodemailer from "nodemailer";
import { STORE } from "./config";
import { formatPrice } from "./format";

export type OrderEmailKind = "received" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface EmailOrder {
  order_number: string;
  customer_name: string;
  email?: string | null;
  phone?: string;
  address?: string;
  city: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  courier?: string | null;
  tracking_number?: string | null;
  items: { product_name: string; quantity: number; unit_price: number; line_total: number; product_image?: string | null }[];
}

export const emailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;
function getTransport() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

const from = () => process.env.SMTP_FROM || `${STORE.name} <${process.env.SMTP_USER}>`;

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
  const shipping =
    kind === "shipped" && (o.courier || o.tracking_number)
      ? `<div style="margin:20px 0;padding:16px;border-radius:14px;background:#E8F3F2;font-size:14px;color:#0D5B58">
          ${o.courier ? `Courier: <b>${esc(o.courier)}</b><br>` : ""}${o.tracking_number ? `Tracking number: <b>${esc(o.tracking_number)}</b>` : ""}
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
        ${shipping}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">${rows}
          <tr><td style="padding:10px 0 0;font-size:14px;color:#6B6B6B">Subtotal</td><td style="padding:10px 0 0;font-size:14px;text-align:right">${formatPrice(o.subtotal)}</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#6B6B6B">Delivery</td><td style="padding:6px 0;font-size:14px;text-align:right">${Number(o.shipping_fee) === 0 ? "Free" : formatPrice(o.shipping_fee)}</td></tr>
          <tr><td style="padding:10px 0;font-size:16px;font-weight:700;color:#0D5B58">Total (Cash on Delivery)</td><td style="padding:10px 0;font-size:16px;font-weight:700;color:#0D5B58;text-align:right">${formatPrice(o.total)}</td></tr>
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
    .join("\n")}\nTotal (COD): ${formatPrice(o.total)}\n\n${site}`;
  return { subject: c.subject(o.order_number), html, text };
}

/** Sends a customer email for an order event. Never throws — returns whether it was sent. */
export async function sendOrderEmail(kind: OrderEmailKind, order: EmailOrder): Promise<boolean> {
  if (!emailConfigured() || !order.email) return false;
  try {
    const { subject, html, text } = render(kind, order);
    await getTransport().sendMail({ from: from(), to: order.email, replyTo: process.env.SMTP_REPLY_TO || STORE.email || undefined, subject, html, text });
    return true;
  } catch (e) {
    console.error("sendOrderEmail failed", kind, order.order_number, e);
    return false;
  }
}

/** Alerts the store owner about a new order. */
export async function sendNewOrderAlert(order: EmailOrder) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!emailConfigured() || !to) return false;
  try {
    const site = STORE.siteUrl.replace(/\/$/, "");
    await getTransport().sendMail({
      from: from(),
      to,
      subject: `🛒 New order ${order.order_number} — ${formatPrice(order.total)}`,
      text: `New order ${order.order_number}\n\n${order.customer_name}\n${order.phone || ""}\n${order.email || ""}\n${order.address || ""}, ${order.city}\n\n${order.items
        .map((i) => `- ${i.product_name} x${i.quantity}: ${formatPrice(i.line_total)}`)
        .join("\n")}\n\nTotal (COD): ${formatPrice(order.total)}\n\nManage: ${site}/admin/orders`,
    });
    return true;
  } catch (e) {
    console.error("sendNewOrderAlert failed", e);
    return false;
  }
}
