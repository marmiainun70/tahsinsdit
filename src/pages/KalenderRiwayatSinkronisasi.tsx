import { useSyncHistory } from "@/hooks/useAcademicCalendar";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ChevronLeft, RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const STATUS_ICON: Record<string, React.ReactNode> = {
  sukses: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  gagal: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
  sebagian_gagal: <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />,
};

const STATUS_BADGE: Record<string, string> = {
  sukses: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  gagal: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  sebagian_gagal: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
};

const RiwayatSinkronisasi = () => {
  const { data: history = [], isLoading } = useSyncHistory();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/kalender-akademik"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Kalender
          </Link>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Riwayat Sinkronisasi Libur</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Rekam jejak setiap proses pengambilan data libur nasional dari internet.
          </p>
        </div>

        {/* Daftar Riwayat */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Clock className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Belum ada riwayat sinkronisasi.</p>
            <p className="text-xs text-muted-foreground/70">
              Riwayat akan muncul setelah Anda membuat tahun ajaran atau menekan tombol "Sinkronkan Libur".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-3"
              >
                {/* Baris atas: status dan waktu */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {STATUS_ICON[item.status]}
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_BADGE[item.status])}>
                      {item.status === "sukses" ? "Berhasil" : item.status === "gagal" ? "Gagal" : "Sebagian Gagal"}
                    </span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                      {item.trigger_type === "manual" ? "Manual" : "Otomatis (Buat Tahun Ajaran)"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(item.started_at), "dd MMM yyyy, HH:mm", { locale: id })}
                  </span>
                </div>

                {/* Detail */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2">
                    <p className="text-sm font-bold text-emerald-600">+{item.jumlah_ditambah}</p>
                    <p className="text-[10px] text-muted-foreground">Ditambahkan</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2">
                    <p className="text-sm font-bold text-blue-600">~{item.jumlah_diupdate}</p>
                    <p className="text-[10px] text-muted-foreground">Diperbarui</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/30 p-2">
                    <p className="text-sm font-bold text-slate-500">{item.jumlah_dilewati}</p>
                    <p className="text-[10px] text-muted-foreground">Dilewati</p>
                  </div>
                </div>

                {/* Tahun yang disync */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">Tahun:</span>
                  <span>{item.tahun_yang_disync}</span>
                  {item.triggered_by_role && (
                    <>
                      <span>·</span>
                      <span>Oleh: {item.triggered_by_role}</span>
                    </>
                  )}
                  {item.finished_at && (
                    <>
                      <span>·</span>
                      <span>
                        Selesai:{" "}
                        {format(new Date(item.finished_at), "HH:mm:ss", { locale: id })}
                      </span>
                    </>
                  )}
                </div>

                {/* Pesan error */}
                {item.error_message && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2">
                    <p className="text-xs text-red-600 dark:text-red-400 font-mono">{item.error_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiwayatSinkronisasi;
