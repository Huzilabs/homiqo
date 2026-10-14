export default function SetupNotice() {
  return (
    <div className="container-x py-10">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Connect Supabase to load products</p>
        <p className="mt-1 text-sm">
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment and run{" "}
          <code>supabase/schema.sql</code> in the Supabase SQL editor. See README.md.
        </p>
      </div>
    </div>
  );
}
