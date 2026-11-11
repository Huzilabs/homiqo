import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Turn an abandoned checkout into a real COD order (admin only). The lead flips to "Ordered" automatically. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const { data: lead } = await supabase
    .from("checkout_leads")
    .select("customer_name, phone, city, address, items, status")
    .eq("id", id)
    .maybeSingle();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.status === "converted") return NextResponse.json({ error: "Already ordered" }, { status: 400 });

  const items = ((lead.items || []) as { product_id?: string; quantity?: number }[])
    .filter((i) => i.product_id && Number(i.quantity) > 0)
    .map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) }));
  if (!items.length) return NextResponse.json({ error: "No products saved for this lead" }, { status: 400 });

  const { data, error } = await supabase.rpc("place_order", {
    customer: {
      customer_name: lead.customer_name || "",
      phone: lead.phone,
      city: lead.city || "",
      address: lead.address || "",
      payment_method: "cod",
      notes: "Order created from abandoned checkout (WhatsApp follow-up)",
    },
    items,
  });
  if (error) return NextResponse.json({ error: error.message.replace(/^.*?: /, "") }, { status: 400 });
  return NextResponse.json({ order_number: (data as { order_number: string }).order_number });
}
