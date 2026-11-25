"use client";
import { useEffect, useState } from "react";
import { PenLine, X } from "lucide-react";
import OpenReviewForm from "./OpenReviewForm";

/** Product page: "Write a review" → popup form for customers who received this product. */
export default function WriteReview({ productId, productName, compact = false }: { productId: string; productName: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)} className={`btn-secondary w-full sm:w-auto ${compact ? "shrink-0" : "mt-6"}`}>
        <PenLine className="h-4 w-4" /> Write a review
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 sm:items-center sm:p-4" onClick={() => setOpen(false)} role="presentation">
          <div role="dialog" aria-modal="true" aria-label="Write a review" onClick={(e) => e.stopPropagation()} className="max-h-[92svh] w-full overflow-y-auto bg-paper p-5 shadow-2xl sm:max-w-md sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">Write a review</p>
                <p className="text-sm text-ink/60">{productName}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="-mr-1 -mt-1 p-2 text-ink/50 hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <OpenReviewForm productId={productId} productName={productName} onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
