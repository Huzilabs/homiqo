// Minimal service worker so the admin panel can be installed as an app.
// Always uses the network (admin data must be live); shows a short offline note if there is no connection.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(
    fetch(e.request).catch(
      () => new Response("<meta name=viewport content='width=device-width'><body style='font-family:sans-serif;padding:24px'><h2>No internet</h2><p>Connect to the internet and reopen Homiqo Admin.</p></body>", { headers: { "content-type": "text/html" } })
    )
  );
});

// ── New-order push notifications (sent by the Supabase "order-push" function) ──
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "Homiqo", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(Promise.all([
    // If the admin app is open, tell it to play the "ka-ching" order sound (phones only allow the system sound for notifications)
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => wins.forEach((w) => w.postMessage({ type: "homiqo-new-order", title: d.title, url: d.url }))),
    self.registration.showNotification(d.title || "🛒 New order", {
      body: d.body || "",
      icon: "/admin-icon-192.png",
      badge: "/admin-icon-192.png",
      tag: d.tag || undefined,
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: { url: d.url || "/admin/orders" },
    }),
  ]));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/admin/orders", self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const w = wins.find((c) => c.url.startsWith(self.location.origin + "/admin"));
      if (w) return w.focus().then(() => w.navigate(url));
      return self.clients.openWindow(url);
    })
  );
});
