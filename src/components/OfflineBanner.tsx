import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow"
    >
      <WifiOff className="h-3.5 w-3.5" />
      Koneksi terputus — Anda dalam mode baca. Perubahan belum bisa disimpan.
    </div>
  );
}
