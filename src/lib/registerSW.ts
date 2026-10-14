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
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
