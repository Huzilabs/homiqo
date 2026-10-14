import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured) {
    return <div className="p-10">Supabase is not configured. Set the environment variables first (see README).</div>;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-bold">No admin access</h1>
        <p className="max-w-md text-sm text-gray-600">
          {user.email} is signed in but is not an admin. Add this user to the <code>admins</code> table (see README).
        </p>
        <Link href="/" className="btn-secondary">Back to store</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav email={user.email || ""} />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
