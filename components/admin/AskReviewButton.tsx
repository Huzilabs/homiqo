"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Opens WhatsApp with the review request and marks the order as asked (so it leaves the list). */
export default function AskReviewButton({ orderId, href }: { orderId: string; href: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const mark = async () => {
    await createClient().from("orders").update({ review_asked_at: new Date().toISOString() }).eq("id", orderId);
    setDone(true);
    setTimeout(() => router.refresh(), 1500);
  };
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={mark}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white ${done ? "bg-gray-400" : "bg-[#25D366] hover:bg-[#1ebe5b]"}`}
      >
        <MessageCircle className="h-4 w-4" /> {done ? "Sent" : "Ask on WhatsApp"}
      </a>
      {!done && (
        <button onClick={mark} className="rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Remove from this list without messaging">
          Skip
        </button>
      )}
    </span>
  );
}
