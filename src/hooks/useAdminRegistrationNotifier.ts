import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Listen to new profile INSERTs (pendaftaran akun baru) and show a native
 * browser notification. Only active when `enabled` is true (admin dashboard).
 */
export function useAdminRegistrationNotifier(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    // Request browser notification permission on first mount
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }

    const channel = supabase
      .channel("admin-new-registrations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const row = payload.new as { full_name?: string | null; username?: string | null; role?: string | null };
          const name = row.full_name?.trim() || row.username?.trim() || "Pengguna baru";
          const body = `${name} baru saja mendaftar${row.role ? ` sebagai ${row.role}` : ""}.`;

          // Native browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              const n = new Notification("Pendaftaran Baru!", {
                body,
                icon: "/favicon.ico",
                tag: `registration-${payload.new?.["user_id"] ?? Date.now()}`,
              });
              n.onclick = () => {
                window.focus();
                window.location.href = "/kelola-akun";
                n.close();
              };
            } catch {
              // ignore
            }
          }

          // In-app toast fallback
          toast({ title: "Pendaftaran Baru!", description: body });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled]);
}
