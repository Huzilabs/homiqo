"use client";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Shrink a phone photo to ≤1400px JPEG before upload (keeps uploads small on mobile data). */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("photo"))), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}

/** Product page review: name, stars, comment and an optional photo. Shown on the site after admin approval. */
export default function OpenReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = photo ? URL.createObjectURL(photo) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Please choose a star rating.");
    setBusy(true);
    setError(null);
    let photo_url: string | null = null;
    if (photo) {
      const supabase = createClient();
      const path = `pending/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage.from("review-photos").upload(path, await shrink(photo), { contentType: "image/jpeg" });
      if (upErr) {
        setBusy(false);
        return setError("Could not upload the photo. Try a smaller photo, or send the review without it.");
      }
      photo_url = supabase.storage.from("review-photos").getPublicUrl(path).data.publicUrl;
    }
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: true, product_id: productId, rating, comment, name, photo_url }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.ok) return setError(data.error || "Could not save your review.");
    setDone(true);
  }

  if (done) return <p className="bg-leaf-100/70 p-4 text-sm font-medium text-leaf-600">Thank you! Your review of the {productName} will appear here after a quick check.</p>;

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
        <label className="label" htmlFor={`on-${productId}`}>Your name *</label>
        <input id={`on-${productId}`} required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label" htmlFor={`oc-${productId}`}>Your review</label>
        <textarea id={`oc-${productId}`} value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={1500} className="input" placeholder="How do you like it? What do you use it for?" />
      </div>
      <div>
        <p className="label">Photo (optional)</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        {preview ? (
          <span className="relative mt-1 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your photo" className="h-24 w-24 object-cover" />
            <button type="button" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }} aria-label="Remove photo" className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white"><X className="h-3.5 w-3.5" /></button>
          </span>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 flex h-24 w-24 flex-col items-center justify-center gap-1 border border-dashed border-ink/30 text-xs text-ink/60 hover:border-ink">
            <ImagePlus className="h-6 w-6" /> Add photo
          </button>
        )}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Submit review
      </button>
    </form>
  );
}
