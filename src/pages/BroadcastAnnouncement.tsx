import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function BroadcastAnnouncement() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<"all" | "guru" | "wali">("all");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  if (isAdmin === false) return <Navigate to="/" replace />;
  if (isAdmin === null) return <div className="p-8 text-muted-foreground">Memuat...</div>;

  const send = async () => {
    if (!title.trim() || !body.trim()) { toast.error("Judul dan isi wajib diisi"); return; }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("broadcast-announcement", {
      body: { title, body, audience, link: link || null },
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Terkirim — Inbox: ${data?.inbox ?? 0}, Push: ${data?.sent ?? 0}`);
    setTitle(""); setBody(""); setLink("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
          <Megaphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pengumuman</h1>
          <p className="text-sm text-muted-foreground">Kirim pengumuman ke semua pengguna</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-sm font-medium">Audiens</label>
          <div className="flex gap-2 mt-2">
            {([["all","Semua"],["guru","Guru"],["wali","Wali Murid"]] as const).map(([k,l]) => (
              <button key={k} onClick={() => setAudience(k)}
                className={`px-3 py-1.5 rounded-xl text-sm border ${audience===k?"bg-primary text-primary-foreground border-primary":"border-border"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Judul</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background" placeholder="Judul pengumuman" />
        </div>
        <div>
          <label className="text-sm font-medium">Isi</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={4}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background" placeholder="Tulis pengumuman..." />
        </div>
        <div>
          <label className="text-sm font-medium">Link (opsional)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background" placeholder="/laporan-bulanan" />
        </div>
        <button onClick={send} disabled={sending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-60">
          <Send className="w-4 h-4" /> {sending ? "Mengirim..." : "Kirim Pengumuman"}
        </button>
      </div>
    </div>
  );
}
