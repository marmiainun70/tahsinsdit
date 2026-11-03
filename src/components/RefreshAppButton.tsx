import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { del } from "idb-keyval";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

/** Membersihkan cache offline & memuat versi aplikasi terbaru. */
export default function RefreshAppButton() {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    if (!navigator.onLine) {
      alert("Tidak ada koneksi internet. Sambungkan internet terlebih dahulu.");
      return;
    }
    setBusy(true);
    try {
      queryClient.clear();
      await del("tahsin-offline-cache").catch(() => {});
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.allSettled(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js")).map((r) => r.update()));
      }
      sessionStorage.removeItem("sw-auto-reloaded");
    } finally {
      window.location.reload();
    }
  };

  return (
    <Button onClick={handleRefresh} disabled={busy} variant="outline" size="sm" className="w-full sm:w-auto gap-2">
      <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Memperbarui..." : "Perbarui Aplikasi & Bersihkan Cache"}
    </Button>
  );
}
