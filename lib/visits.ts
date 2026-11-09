"use client";
/** Lightweight first-party visit tracking → /api/track (stored in Supabase, shown in admin → Analytics). */

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const SESSION_GAP = 30 * 60 * 1000; // a new session after 30 minutes of inactivity

function ids() {
  try {
    let vid = localStorage.getItem("hq.vid");
    if (!vid) localStorage.setItem("hq.vid", (vid = rid()));
    const raw = JSON.parse(localStorage.getItem("hq.sess") || "null") as { id: string; t: number; src?: Record<string, string> } | null;
    const fresh = !raw || Date.now() - raw.t > SESSION_GAP;
    const sess = fresh ? { id: rid(), t: Date.now(), src: undefined as Record<string, string> | undefined } : raw!;
    sess.t = Date.now();
    return { vid, sess, fresh, save: () => localStorage.setItem("hq.sess", JSON.stringify(sess)) };
  } catch {
    return null;
  }
}

export function sendVisitEvent(type: string, extra: { pid?: string; val?: number } = {}) {
  if (typeof window === "undefined" || navigator.webdriver) return;
  const s = ids();
  if (!s) return;
  const payload: Record<string, unknown> = { type, vid: s.vid, sid: s.sess.id, path: location.pathname, ...extra };
  if (s.fresh) {
    // remember where this session came from (first page only)
    const q = new URLSearchParams(location.search);
    const ref = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : "";
    s.sess.src = { ref, us: q.get("utm_source") || (q.get("fbclid") ? "facebook" : ""), um: q.get("utm_medium") || "", uc: q.get("utm_campaign") || "" };
  }
  Object.assign(payload, s.sess.src || {});
  s.save();
  // Tag the Clarity recording with the same ids the admin shows (set on every event so it is never missed)
  try {
    const c = (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity;
    if (c) {
      c("set", "hq_session", s.sess.id);
      c("set", "hq_visitor", s.vid);
      if (s.sess.src?.us) c("set", "utm_source", s.sess.src.us);
      if (s.sess.src?.uc) c("set", "utm_campaign", s.sess.src.uc);
    }
  } catch {}
  const body = JSON.stringify(payload);
  if (!(navigator.sendBeacon && navigator.sendBeacon("/api/track", new Blob([body], { type: "text/plain" })))) {
    fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
  }
}
