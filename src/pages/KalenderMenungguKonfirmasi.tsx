import { usePendingConfirmationDays, useUpdateCalendarDay } from "@/hooks/useAcademicCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, ChevronLeft, Info } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { JENIS_CONFIG } from "@/components/kalender/CalendarDayCell";
import { JenisHari } from "@/hooks/useAcademicCalendar";

const MenungguKonfirmasi = () => {
  const { user, profile } = useAuth();
  const { data: pendingDays = [], isLoading } = usePendingConfirmationDays();
  const updateDay = useUpdateCalendarDay();

  const handleKonfirmasi = async (tanggal: string, statusBaru: "efektif" | "tidak_efektif") => {
    if (!user) return;
    await updateDay.mutateAsync({
      tanggal,
      updates: { status: statusBaru },
      changedByRole: profile?.role ?? "koordinator",
      changedBy: user.id,
      alasan: "Konfirmasi manual dari halaman menunggu konfirmasi",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <Link to="/kalender-akademik" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Kalender
          </Link>
          <h1 className="text-xl font-bold text-foreground">Hari Menunggu Konfirmasi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hari-hari berikut perlu dikonfirmasi apakah termasuk hari efektif atau libur.
          </p>
        </div>

        {/* Catatan peringatan */}
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Jika hari-hari ini tidak dikonfirmasi sebelum Anda menekan tombol <strong>Rekap Bulanan</strong> di halaman kalender, 
            sistem akan otomatis mengubahnya menjadi <strong>Tidak Efektif</strong>. Anda tetap bisa mengubahnya kembali kapan saja setelahnya.
          </p>
        </div>

        {/* Daftar Hari */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Semua hari sudah dikonfirmasi!</p>
            <p className="text-xs text-muted-foreground">Tidak ada hari yang menunggu konfirmasi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {pendingDays.length} hari menunggu
            </p>
            {pendingDays.map((day) => (
              <div
                key={day.id}
                className="rounded-xl border border-violet-200 dark:border-violet-800 bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-500" />
                      <p className="text-sm font-semibold text-foreground">
                        {format(new Date(day.tanggal), "EEEE, dd MMMM yyyy", { locale: id })}
                      </p>
                    </div>
                    {day.jenis && (
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full inline-block",
                        JENIS_CONFIG[day.jenis as JenisHari]?.badge
                      )}>
                        {JENIS_CONFIG[day.jenis as JenisHari]?.label}
                      </span>
                    )}
                    {day.keterangan && (
                      <p className="text-xs text-muted-foreground">{day.keterangan}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70">
                      Sumber: {day.source === "api_libur" ? "Sinkronisasi API Libur" : day.source}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 h-7"
                      onClick={() => handleKonfirmasi(day.tanggal, "efektif")}
                      disabled={updateDay.isPending}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Efektif
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30 h-7"
                      onClick={() => handleKonfirmasi(day.tanggal, "tidak_efektif")}
                      disabled={updateDay.isPending}
                    >
                      <XCircle className="w-3 h-3" />
                      Tidak Efektif
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenungguKonfirmasi;
