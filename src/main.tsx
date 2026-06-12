import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register push service worker — skip inside iframe / Lovable preview to avoid stale cache issues.
function isInIframe() {
  try { return window.self !== window.top; } catch { return true; }
}
function isPreviewHost() {
  const h = window.location.hostname;
  return h.includes("id-preview--") || h.includes("lovableproject.com");
}

if ("serviceWorker" in navigator) {
  if (isInIframe() || isPreviewHost()) {
    // Cleanup any previously registered SW in preview/iframe contexts
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
