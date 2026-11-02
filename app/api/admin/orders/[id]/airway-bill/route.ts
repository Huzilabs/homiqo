import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-auth";

/** Streams the PostEx airway bill (shipping label) PDF for printing. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminClient();
  if (!supabase) return new NextResponse("Not allowed", { status: 403 });
  const { data, error } = await supabase.rpc("postex_airway_bill", { p_order_id: id });
  if (error || !data) return new NextResponse(error?.message || "Airway bill not available", { status: 400 });
  return new NextResponse(Buffer.from(String(data), "base64"), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="airway-bill-${id.slice(0, 8)}.pdf"` },
  });
}
