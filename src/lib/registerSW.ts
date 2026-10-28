// Single guarded registration point for the app service worker (/sw.js).
function refused(): boolean {
  if (!import.meta.env.PROD) return true;
  try { if (window.self !== window.top) return true; } catch { return true; }
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  const blocked = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];
  if (blocked.some((d) => h === d || h.endsWith(`.${d}`))) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

export function registerAppSW() {
  if (!("serviceWorker" in navigator)) return;
  if (refused()) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => {
        if (r.active?.scriptURL.endsWith("/sw.js") || r.installing?.scriptURL.endsWith("/sw.js") || r.waiting?.scriptURL.endsWith("/sw.js")) r.unregister();
      }),
    );
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Auto-reload once when a new version of the app takes control,
        // so phones running the installed PWA pick up updates automatically.
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (sessionStorage.getItem("sw-auto-reloaded")) return;
            sessionStorage.setItem("sw-auto-reloaded", "1");
            window.location.reload();
          });
        }
        // Check for a newer version every hour.
        window.setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch(() => {});
  });
}
