import { NextResponse } from "next/server";
import { adminClient } from "@/lib/admin-auth";
import { airwayBills3PerPage } from "@/lib/airway-layout";

export const maxDuration = 60;

/** Several PostEx airway bills merged into one PDF: /api/admin/orders/airway-bills?ids=a,b,c */
export async function GET(req: Request) {
  const supabase = await adminClient();
  if (!supabase) return new NextResponse("Not allowed", { status: 403 });
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 60);
  if (!ids.length) return new NextResponse("No orders selected", { status: 400 });

  // fetch 4 at a time from PostEx, keep the order the admin picked them in
  const pdfs: (Uint8Array | null)[] = new Array(ids.length).fill(null);
  const failed: string[] = [];
  for (let i = 0; i < ids.length; i += 4) {
    await Promise.all(
      ids.slice(i, i + 4).map(async (id, j) => {
        const { data, error } = await supabase.rpc("postex_airway_bill", { p_order_id: id });
        if (error || !data) failed.push(id);
        else pdfs[i + j] = Buffer.from(String(data), "base64");
      }),
    );
  }

  const got = pdfs.filter((p): p is Uint8Array => !!p);
  if (!got.length) return new NextResponse("No airway bills available — are these orders booked on PostEx?", { status: 400 });
  // 3 labels per A4 page (PostEx gives one per page)
  return new NextResponse(Buffer.from(await airwayBills3PerPage(got)), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="airway-bills-${ids.length}.pdf"`,
      ...(failed.length ? { "X-Missing": String(failed.length) } : {}),
    },
  });
}
