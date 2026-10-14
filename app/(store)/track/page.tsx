"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LoaderCircle, PackageSearch } from "lucide-react";
import OrderDetails from "@/components/OrderDetails";
import { createClient } from "@/lib/supabase/client";
import type { TrackedOrder } from "@/lib/types";

function TrackForm() {
  const params = useSearchParams();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    setOrder(null);
    const { data, error } = await createClient().rpc("track_order", {
      p_order_number: String(f.get("order")),
      p_phone: String(f.get("phone")),
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (!data) return setError("We couldn’t find an order with that number and phone. Please check and try again.");
    setOrder(data as TrackedOrder);
  }

  return (
    <>
      <form onSubmit={onSubmit} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="order" className="label">Order number</label>
          <input id="order" name="order" required defaultValue={params.get("order") || ""} placeholder="HC-XXXXXX" className="input uppercase" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone number</label>
          <input id="phone" name="phone" type="tel" required placeholder="03XX XXXXXXX" className="input" />
        </div>
        <button disabled={loading} className="btn-primary h-[42px]">
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />} Track
        </button>
      </form>
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {order && <div className="mt-8"><OrderDetails order={order} /></div>}
    </>
  );
}

export default function TrackPage() {
  return (
    <div className="container-x max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Track your order</h1>
      <p className="mt-2 text-gray-600">Enter the order number from your confirmation and the phone number you ordered with.</p>
      <div className="mt-8">
        <Suspense>
          <TrackForm />
        </Suspense>
      </div>
    </div>
  );
}
