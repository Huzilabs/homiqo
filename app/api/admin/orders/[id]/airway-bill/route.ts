import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-auth";

/** Streams the PostEx airway bill (shipping label) PDF for printing. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminClient();
  if (!supabase) return new NextResponse("Not allowed", { status: 403 });
  const replacement = new URL(req.url).searchParams.get("replacement") === "1";
  const { data, error } = replacement
    ? await supabase.rpc("postex_airway_bill", { p_order_id: id, p_replacement: true })
    : await supabase.rpc("postex_airway_bill", { p_order_id: id });
  if (error || !data) return new NextResponse(error?.message || "Airway bill not available", { status: 400 });
  return new NextResponse(Buffer.from(String(data), "base64"), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="airway-bill-${id.slice(0, 8)}.pdf"` },
  });
}
