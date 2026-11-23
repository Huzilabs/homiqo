"use client";
import { useEffect } from "react";

/** Plays the Homiqo "ka-ching" when a new-order push arrives while the admin app is open. */
export default function OrderSound() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const audio = new Audio("/sounds/new-order.mp3");
    audio.preload = "auto";
    // Browsers only allow sound after the user has touched the page once — unlock on the first tap.
    const unlock = () => {
      audio.muted = true;
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; audio.muted = false; }).catch(() => {});
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type !== "homiqo-new-order") return;
      audio.currentTime = 0;
      audio.muted = false;
      audio.play().catch(() => {});
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMsg);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);
  return null;
}
