import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, Check } from "lucide-react";
import { toast } from "sonner";

type Prefs = {
  monthly_report: boolean;
  exam_result: boolean;
  exam_reminder: boolean;
  attention_alert: boolean;
  announcement: boolean;
};

const DEFAULTS: Prefs = {
  monthly_report: true, exam_result: true, exam_reminder: true,
  attention_alert: true, announcement: true,
};

const ITEMS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "monthly_report", label: "Laporan Bulanan", desc: "Saat laporan bulanan baru tersedia" },
  { key: "exam_result", label: "Hasil Ujian", desc: "Saat hasil ujian dicatat" },
  { key: "exam_reminder", label: "Pengingat Ujian", desc: "H-1 sebelum jadwal ujian" },
  { key: "attention_alert", label: "Perlu Perhatian", desc: "Peringatan untuk siswa yang perlu perhatian" },
  { key: "announcement", label: "Pengumuman", desc: "Pengumuman dari admin" },
];

export default function NotificationSettings() {
  const { user } = useAuth();
  const push = usePushNotifications();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setPrefs({ ...DEFAULTS, ...data }); });
  }, [user]);

  const save = async (next: Prefs) => {
    if (!user) return;
    setPrefs(next);
    setSaving(true);
    const { error } = await supabase.from("notification_preferences")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Gagal menyimpan");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Notifikasi</h1>
        <p className="text-muted-foreground text-sm">Atur jenis notifikasi yang ingin Anda terima</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${push.subscribed ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
            {push.subscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold">Push Notification</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {!push.supported && "Browser/perangkat ini tidak mendukung push notification."}
              {push.supported && push.subscribed && "Aktif — Anda akan menerima notifikasi meski aplikasi tertutup."}
              {push.supported && !push.subscribed && "Aktifkan untuk menerima notifikasi di perangkat ini."}
            </p>
            {push.isPreview && (
              <p className="text-[11px] text-amber-600 mt-1">Catatan: push notification hanya bekerja di versi published, bukan preview.</p>
            )}
          </div>
          {push.supported && (
            push.subscribed
              ? <button onClick={push.unsubscribe} disabled={push.loading} className="px-3 py-1.5 rounded-xl border text-xs">Matikan</button>
              : <button onClick={push.subscribe} disabled={push.loading} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">Aktifkan</button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl divide-y">
        {ITEMS.map((it) => (
          <label key={it.key} className="flex items-center gap-3 p-4 cursor-pointer">
            <div className="flex-1">
              <p className="text-sm font-medium">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.desc}</p>
            </div>
            <input
              type="checkbox"
              checked={prefs[it.key]}
              onChange={(e) => save({ ...prefs, [it.key]: e.target.checked })}
              className="w-5 h-5 accent-primary"
            />
          </label>
        ))}
      </div>
      {saving && <p className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3" /> Menyimpan...</p>}
    </div>
  );
}
