"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { hadFlash, writeFlash } from "@/lib/flash";

const META = /^(facebook|instagram|fb|ig|meta)$/i;

/** Starts the timed offer once, for visitors who arrive from a Meta (Facebook/Instagram) ad. */
export default function FlashOfferInit() {
  const params = useSearchParams();
  useEffect(() => {
    const source = params.get("utm_source") || "";
    const fromMeta = META.test(source) || params.has("fbclid");
    if (!fromMeta || hadFlash()) return;
    fetch("/api/flash", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: source || "fbclid" }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.id && writeFlash({ id: d.id, expires_at: d.expires_at }))
      .catch(() => {});
  }, [params]);
  return null;
}
