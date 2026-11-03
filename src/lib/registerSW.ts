// Single guarded registration point for the app service worker (/sw.js).
export const APP_UPDATE_EVENT = "app-update-available";
let updateAvailable = false;
export const isAppUpdateAvailable = () => updateAvailable;
function markAppUpdateAvailable() {
  if (updateAvailable) return;
  updateAvailable = true;
  window.dispatchEvent(new Event(APP_UPDATE_EVENT));
}
export function useAppUpdateAvailable(): boolean {
  const [v, setV] = useState(updateAvailable);
  useEffect(() => {
    const on = () => setV(true);
    window.addEventListener(APP_UPDATE_EVENT, on);
    if (updateAvailable) setV(true);
    return () => window.removeEventListener(APP_UPDATE_EVENT, on);
  }, []);
  return v;
}
import { useEffect, useState } from "react";
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
        // Announce a new version (only when an older version was already running).
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if ((sw.state === "installed" || sw.state === "activated") && navigator.serviceWorker.controller) {
              markAppUpdateAvailable();
            }
          });
        });
        // Check for a newer version every hour.
        window.setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch(() => {});
  });
}
