"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Public VAPID key (the private key stays in Supabase Vault)
const VAPID_PUBLIC = "BN4nVoBTwsz-AqKlbuXX1dyJPyCBNKTMIPOr2q5JJS9SutbTvqQVVNhIwFkBsrZ3T9IDHH7mO8fRN-11uZxO7ck";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function b64ToBytes(b64: string) {
  const s = (b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(s);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/admin")) || navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" });
}

/** "Order notifications" switch for this device. `variant="banner"` = dashboard prompt (hidden once on). */
export default function PushToggle({ variant = "nav" }: { variant?: "nav" | "banner" }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState(ios && !standalone ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "denied" : "off"); return; }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) }));
      const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("push_subscriptions").upsert(
        { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_id: u.user?.id, label: navigator.userAgent.slice(0, 120) },
        { onConflict: "endpoint" },
      );
      if (error) throw new Error(error.message);
      await supabase.rpc("admin_push_test");
      setState("on");
      setMsg("Done — a test notification is on its way.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not turn on notifications");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      setMsg(null);
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    await createClient().rpc("admin_push_test");
    setBusy(false);
    setMsg("Test sent — it should arrive in a few seconds.");
  }

  if (variant === "banner") {
    if (state === "loading" || state === "on" || state === "unsupported") return msg ? <p className="card border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">{msg}</p> : null;
    return (
      <div className="card flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50 p-4">
        <p className="flex items-center gap-2 text-sm text-amber-900">
          <BellRing className="h-5 w-5 shrink-0" />
          {state === "ios-install" ? (
            <span><b>iPhone:</b> add Homiqo Admin to your Home Screen (Share → Add to Home Screen), open it from there, then turn on notifications.</span>
          ) : state === "denied" ? (
            <span>Notifications are <b>blocked</b> for this app. Allow them in your phone/browser settings (Site settings → Notifications), then reload.</span>
          ) : (
            <span>Get a notification on this device for <b>every new order</b>.</span>
          )}
        </p>
        {state === "off" && (
          <button onClick={enable} disabled={busy} className="inline-flex items-center gap-2 bg-gray-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-black disabled:opacity-60">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Turn on notifications
          </button>
        )}
        {msg && <p className="w-full text-sm text-rose-700">{msg}</p>}
      </div>
    );
  }

  // nav variant
  if (state === "loading" || state === "unsupported") return null;
  return (
    <div className="px-3 py-2 text-xs">
      {state === "on" ? (
        <div className="flex items-center justify-between gap-2 text-emerald-300">
          <span className="flex items-center gap-1.5"><BellRing className="h-4 w-4" /> Order alerts on</span>
          <span className="flex gap-2">
            <button onClick={test} disabled={busy} className="text-gray-300 underline-offset-2 hover:text-white hover:underline">Test</button>
            <button onClick={disable} disabled={busy} className="text-gray-400 underline-offset-2 hover:text-white hover:underline">Turn off</button>
          </span>
        </div>
      ) : state === "off" ? (
        <button onClick={enable} disabled={busy} className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Turn on order alerts
        </button>
      ) : (
        <p className="flex items-center gap-1.5 text-gray-400"><BellOff className="h-4 w-4" /> {state === "denied" ? "Alerts blocked in settings" : "Install app to get alerts"}</p>
      )}
      {msg && <p className="mt-1 text-gray-300">{msg}</p>}
    </div>
  );
}
