"use client";
import { useEffect } from "react";

/** Registers the admin service worker so "Install app" / "Add to Home screen" works. */
export default function AdminSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {});
  }, []);
  return null;
}
