import { NextResponse } from "next/server";
import { placeOrderAndNotify } from "@/lib/place-order";

export async function POST(req: Request) {
  let body: { customer?: Record<string, string>; items?: { product_id: string; quantity: number }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const result = await placeOrderAndNotify(body.customer || {}, body.items || []);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
