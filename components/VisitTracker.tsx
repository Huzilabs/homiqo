"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { sendVisitEvent } from "@/lib/visits";

export default function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    sendVisitEvent("pageview");
  }, [pathname]);
  return null;
}
