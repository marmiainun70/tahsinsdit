import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

// Saat offline, permintaan simpan/ubah ke server ditolak dengan pesan ramah.
// Isian di layar tetap aman; pengguna cukup klik Simpan lagi saat online.
let fetchGuarded = false;
function guardOfflineWrites() {
  if (fetchGuarded || typeof window === "undefined") return;
  fetchGuarded = true;
  const original = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const isWrite = method !== "GET" && method !== "HEAD" && !url.includes("/auth/v1/");
    if (!navigator.onLine && isWrite) {
      toast.error("Koneksi internet terputus", {
        id: "offline-save",
        description: "Data yang Anda ketik tetap aman di layar. Hubungkan internet lalu klik Simpan kembali.",
      });
      return Promise.reject(new TypeError("Offline: perubahan belum bisa disimpan"));
    }
    return original(input, init);
  };
}
guardOfflineWrites();

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
      Koneksi terputus — Anda tetap bisa membaca & mengetik. Menyimpan perlu internet.
    </div>
  );
}
