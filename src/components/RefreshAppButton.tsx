import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { del } from "idb-keyval";
import { Button } from "@/components/ui/button";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppUpdateAvailable } from "@/lib/registerSW";

export async function refreshApp(queryClient: QueryClient) {
  if (!navigator.onLine) {
    alert("Tidak ada koneksi internet. Sambungkan internet terlebih dahulu.");
    return;
  }
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
  } finally {
    window.location.reload();
  }
}

/** Tombol hanya muncul jika ada versi baru aplikasi. */
export default function RefreshAppButton() {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const available = useAppUpdateAvailable();
  if (!available) return null;

  return (
    <Button
      onClick={() => { setBusy(true); refreshApp(queryClient).finally(() => setBusy(false)); }}
      disabled={busy}
      variant="outline"
      size="sm"
      className="w-full sm:w-auto gap-2 border-primary text-primary"
    >
      <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Memperbarui..." : "Perbarui Aplikasi & Bersihkan Cache"}
    </Button>
  );
}

/** Pop-up sekali ketika pembaruan terdeteksi. */
export function AppUpdatePrompt() {
  const available = useAppUpdateAvailable();
  const [dismissed, setDismissed] = useState(false);
  const queryClient = useQueryClient();
  return (
    <AlertDialog open={available && !dismissed} onOpenChange={(o) => !o && setDismissed(true)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pembaruan Aplikasi Tersedia</AlertDialogTitle>
          <AlertDialogDescription>
            Versi terbaru Tahsin SDIT sudah siap. Perbarui sekarang untuk memuat fitur dan data terbaru.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Nanti</AlertDialogCancel>
          <AlertDialogAction onClick={() => refreshApp(queryClient)}>Perbarui Sekarang</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
