// Push-only service worker. No caching, no offline. Safe for Lovable preview.
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "Notifikasi", body: "", link: "/", metadata: {} };
  try { data = { ...data, ...(event.data ? event.data.json() : {}) }; }
  catch { if (event.data) data.body = event.data.text(); }
  const options = {
    body: data.body,
    icon: "/logo.png",
    badge: "/logo.png",
    data: { link: data.link || "/", metadata: data.metadata || {} },
    vibrate: [80, 40, 80],
    tag: data.metadata?.tag || undefined,
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.link || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if ("focus" in c) { c.navigate(url); return c.focus(); }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
