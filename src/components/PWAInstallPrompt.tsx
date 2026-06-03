import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

function isInIframe() { try { return window.self !== window.top; } catch { return true; } }

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInIframe()) return;
    if (localStorage.getItem("pwa-install-dismissed") === "1") { setDismissed(true); return; }
    const handler = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };
  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border border-border rounded-2xl shadow-lg p-3 flex items-center gap-3 max-w-[92vw]">
      <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center flex-shrink-0">
        <Download className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">Pasang Aplikasi</p>
        <p className="text-xs text-muted-foreground">Akses cepat dari layar utama</p>
      </div>
      <button onClick={install} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
        Pasang
      </button>
      <button onClick={dismiss} className="p-1.5 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
