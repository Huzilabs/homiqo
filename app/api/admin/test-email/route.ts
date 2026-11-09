import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTestEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** Open /api/admin/test-email while signed in to admin to check the order-email sender. */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in to admin first" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const result = await sendTestEmail();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
