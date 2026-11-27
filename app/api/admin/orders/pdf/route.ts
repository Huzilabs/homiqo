import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { adminClient } from "@/lib/admin-auth";

/** Selected orders as a downloadable PDF list (for pending orders that have no airway bill yet). */
export async function GET(req: Request) {
  const supabase = await adminClient();
  if (!supabase) return new NextResponse("Not allowed", { status: 403 });
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 200);
  if (!ids.length) return new NextResponse("No orders selected", { status: 400 });

  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,created_at,customer_name,phone,address,city,notes,status,total,order_items(product_name,quantity)")
    .in("id", ids);
  if (error || !data?.length) return new NextResponse(error?.message || "Orders not found", { status: 400 });
  const pos = new Map(ids.map((id, i) => [id, i]));
  const orders = [...data].sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  // Helvetica only knows Latin-1: drop emoji / Urdu letters instead of crashing
  const clean = (s: unknown) => String(s ?? "").replace(/[\r\n\t]+/g, " ").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();
  const wrap = (text: string, f: PDFFont, size: number, width: number) => {
    const lines: string[] = [];
    let line = "";
    for (const w of clean(text).split(/\s+/)) {
      const next = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > width && line) { lines.push(line); line = w; } else line = next;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };
  const rs = (n: number) => "Rs " + Math.round(n).toLocaleString("en-US");
  const pk = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const W = 595, H = 842, M = 40, CW = W - 2 * M;
  let page = doc.addPage([W, H]);
  let y = H - M;
  const header = () => {
    page.drawText("Homiqo orders", { x: M, y: y - 14, size: 16, font: bold });
    page.drawText(clean(`${orders.length} order${orders.length === 1 ? "" : "s"} · ${pk(new Date().toISOString())}`), { x: M, y: y - 30, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 44;
  };
  header();

  orders.forEach((o, i) => {
    const items = ((o.order_items || []) as { product_name: string; quantity: number }[]).map((it) => `${it.quantity}x ${it.product_name}`).join(", ");
    const addr = wrap(`${o.address || ""}, ${o.city || ""}`, font, 10, CW - 20);
    const itemLines = wrap(items, font, 10, CW - 20);
    const noteLines = o.notes ? wrap(`Note: ${o.notes}`, font, 9, CW - 20) : [];
    const h = 34 + (addr.length + itemLines.length) * 13 + noteLines.length * 12 + 10;
    if (y - h < M) { page = doc.addPage([W, H]); y = H - M; }

    page.drawRectangle({ x: M, y: y - h, width: CW, height: h, borderColor: rgb(0.82, 0.82, 0.82), borderWidth: 0.8 });
    let ty = y - 16;
    page.drawText(clean(`${i + 1}. ${o.order_number}`), { x: M + 10, y: ty, size: 11, font: bold });
    const right = clean(`${rs(Number(o.total))} COD · ${String(o.status).toUpperCase()}`);
    page.drawText(right, { x: M + CW - 10 - bold.widthOfTextAtSize(right, 10), y: ty, size: 10, font: bold });
    ty -= 15;
    page.drawText(clean(`${o.customer_name}   ${o.phone}   ·   ${pk(o.created_at)}`), { x: M + 10, y: ty, size: 10, font });
    for (const l of addr) { ty -= 13; page.drawText(l, { x: M + 10, y: ty, size: 10, font, color: rgb(0.25, 0.25, 0.25) }); }
    for (const l of itemLines) { ty -= 13; page.drawText(l, { x: M + 10, y: ty, size: 10, font: bold }); }
    for (const l of noteLines) { ty -= 12; page.drawText(l, { x: M + 10, y: ty, size: 9, font, color: rgb(0.45, 0.3, 0) }); }
    y -= h + 8;
  });

  return new NextResponse(Buffer.from(await doc.save()), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="homiqo-orders-${orders.length}.pdf"` },
  });
}
