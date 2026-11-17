"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { sendVisitEvent } from "@/lib/visits";
import { captureAdRef } from "@/lib/ad-ref";

export default function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    captureAdRef();
    sendVisitEvent("pageview");
  }, [pathname]);
  return null;
}
