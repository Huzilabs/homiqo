"use client";
import { useState } from "react";
import { LoaderCircle, Star } from "lucide-react";

export default function ReviewForm({ orderNumber, phone, productId, productName, defaultName }: { orderNumber: string; phone: string; productId: string; productName: string; defaultName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Please choose a star rating.");
    setBusy(true);
    setError(null);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_number: orderNumber, phone, product_id: productId, rating, comment, name }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.ok) return setError(data.error || "Could not save your review.");
    setDone(true);
  }

  if (done) return <p className="bg-leaf-100/70 p-4 text-sm font-medium text-leaf-600">Thank you! Your review of the {productName} will appear on our website after a quick check.</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="label">Your rating *</p>
        <div className="mt-1 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} star${i > 1 ? "s" : ""}`} className="p-0.5">
              <Star className={`h-8 w-8 ${(hover || rating) >= i ? "fill-accent-500 text-accent-500" : "text-ink/25"}`} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`c-${productId}`}>Your review</label>
        <textarea id={`c-${productId}`} value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={1500} className="input" placeholder="How do you like it? What do you use it for?" />
      </div>
      <div>
        <label className="label" htmlFor={`n-${productId}`}>Name shown with your review</label>
        <input id={`n-${productId}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="input" />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary">
        {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Submit review
      </button>
    </form>
  );
}
