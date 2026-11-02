import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { adminClient } from "@/lib/admin-auth";
import { PRODUCTS_TAG } from "@/lib/products";

/** POST — admin-only: refresh the cached storefront after products change. */
export async function POST() {
  if (!(await adminClient())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  revalidateTag(PRODUCTS_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
