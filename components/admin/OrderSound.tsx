"use client";
import { useEffect } from "react";

/**
 * Plays the Homiqo "ka-ching" when a new-order push arrives while the admin app is open.
 * Uses the Web Audio API (a sound effect), not an <audio> player — an <audio> element makes iPhone show
 * a "Now Playing" music widget on the lock screen.
 */
export default function OrderSound() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    let ctx: AudioContext | null = null;
    let buffer: AudioBuffer | null = null;

    const load = async () => {
      if (!ctx) ctx = new AC();
      if (!buffer) {
        const res = await fetch("/sounds/new-order.mp3");
        const data = await res.arrayBuffer();
        buffer = await new Promise<AudioBuffer>((ok, fail) => ctx!.decodeAudioData(data, ok, fail));
      }
    };
    // Browsers only allow sound after the user has touched the page once — resume the audio engine on that tap.
    const unlock = () => {
      load().then(() => ctx?.resume()).catch(() => {});
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);

    const play = async () => {
      try {
        await load();
        if (ctx!.state === "suspended") await ctx!.resume();
        const src = ctx!.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx!.destination);
        src.start();
      } catch {}
    };
    const onMsg = (e: MessageEvent) => e.data?.type === "homiqo-new-order" && play();
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMsg);
      window.removeEventListener("pointerdown", unlock);
      ctx?.close().catch(() => {});
    };
  }, []);
  return null;
}
