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
