import { useEffect, useState } from "react";
import { Bell, BellRing, Check, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

interface NotifRow {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const typeColor: Record<string, string> = {
  monthly_report: "bg-primary/10 text-primary",
  exam_result: "bg-gold/15 text-gold",
  exam_reminder: "bg-blue-500/10 text-blue-600",
  attention_alert: "bg-destructive/10 text-destructive",
  announcement: "bg-secondary text-foreground",
};

const typeLabel: Record<string, string> = {
  monthly_report: "Laporan Bulanan",
  exam_result: "Hasil Ujian",
  exam_reminder: "Pengingat Ujian",
  attention_alert: "Perlu Perhatian",
  announcement: "Pengumuman",
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotifRow[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.read_at).length;

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => { if (mounted && data) setItems(data as NotifRow[]); });

    const channel = supabase
      .channel("notif-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as NotifRow;
          setItems((prev) => [row, ...prev].slice(0, 30));
          toast(row.title, { description: row.body });
        })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    const ids = items.filter((i) => !i.read_at).map((i) => i.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
    setItems((prev) => prev.map((i) => i.read_at ? i : { ...i, read_at: new Date().toISOString() }));
  };

  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, read_at: new Date().toISOString() } : i));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors" aria-label="Notifikasi">
          {unread > 0 ? <BellRing className="w-5 h-5 text-primary" /> : <Bell className="w-5 h-5 text-muted-foreground" />}
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(360px,92vw)] p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> Tandai dibaca
              </button>
            )}
            <Link to="/pengaturan-notifikasi" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Pengaturan
            </Link>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Belum ada notifikasi</p>
          )}
          {items.map((n) => (
            <div key={n.id} className={`p-3 border-b last:border-b-0 ${!n.read_at ? "bg-primary/[0.03]" : ""}`}>
              <div className="flex items-start gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor[n.type] ?? "bg-muted text-muted-foreground"}`}>
                  {typeLabel[n.type] ?? n.type}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                  {new Date(n.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm font-semibold mt-1">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
              <div className="flex items-center gap-3 mt-2">
                {n.link && (
                  <Link to={n.link} onClick={() => { markOne(n.id); setOpen(false); }} className="text-xs text-primary hover:underline flex items-center gap-1">
                    Buka <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
                {!n.read_at && (
                  <button onClick={() => markOne(n.id)} className="text-xs text-muted-foreground hover:text-foreground">
                    Tandai dibaca
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
