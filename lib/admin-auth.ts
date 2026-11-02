import "server-only";
import { createClient } from "./supabase/server";

/** Returns a Supabase client for a signed-in admin, or null. */
export async function adminClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? supabase : null;
}
