import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { CalendarDay } from "@/hooks/useAcademicCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck2, CalendarX2, Clock, Percent, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarSidebarProps {
  month: Date;
  days: CalendarDay[];
}

export function CalendarSidebar({ month, days }: CalendarSidebarProps) {
  const stats = useMemo(() => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month),
    });

    // Hitung standar (hari Senin-Jumat)
    const standar = daysInMonth.filter((d) => {
      const dow = getDay(d);
      return dow !== 0 && dow !== 6;
    }).length;

    const efektifSekolah = days.filter((d) => d.status === "efektif").length;
    const efektifPembelajaran = days.filter((d) => d.status === "efektif" && d.is_efektif_pembelajaran).length;
    const tidakEfektif = days.filter((d) => d.status === "tidak_efektif").length;
    const menunggu = days.filter((d) => d.status === "menunggu_konfirmasi").length;
    const persentase = standar > 0 ? Math.round((efektifPembelajaran / standar) * 100) : 0;

    return { standar, efektifSekolah, efektifPembelajaran, tidakEfektif, menunggu, persentase };
  }, [month, days]);

  const bulanLabel = format(month, "MMMM yyyy");

  return (
    <div className="space-y-3">
      <Card className="border-primary/20">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Statistik {bulanLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Persentase Besar */}
          <div className="text-center py-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
            <div className="flex items-center justify-center gap-1">
              <Percent className="w-5 h-5 text-emerald-600" />
              <span className="text-3xl font-bold text-emerald-600">{stats.persentase}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Persentase Efektif</p>
            <Progress value={stats.persentase} className="mt-2 h-1.5" />
          </div>

          {/* Statistik Detail */}
          <div className="space-y-2">
            <StatRow
              icon={<CalendarCheck2 className="w-4 h-4 text-emerald-500" />}
              label="Efektif Sekolah"
              value={`${stats.efektifSekolah} / ${stats.standar} hari`}
              valueClass="text-emerald-600 font-semibold"
            />
            <StatRow
              icon={<CalendarCheck2 className="w-4 h-4 text-teal-500" />}
              label="Efektif THS & TFZ"
              value={`${stats.efektifPembelajaran} / ${stats.standar} hari`}
              valueClass="text-teal-600 font-semibold"
            />
            <StatRow
              icon={<CalendarX2 className="w-4 h-4 text-slate-400" />}
              label="Tidak Efektif"
              value={`${stats.tidakEfektif} hari`}
              valueClass="text-slate-500"
            />
            <StatRow
              icon={<Clock className="w-4 h-4 text-violet-500" />}
              label="Menunggu Konfirmasi"
              value={`${stats.menunggu} hari`}
              valueClass={stats.menunggu > 0 ? "text-violet-600 font-semibold" : "text-slate-500"}
            />
            <StatRow
              icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
              label="Standar (Senin-Jumat)"
              value={`${stats.standar} hari`}
              valueClass="text-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Indikator peringatan jika ada hari menunggu konfirmasi */}
      {stats.menunggu > 0 && (
        <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-3">
          <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">
            ⚠️ {stats.menunggu} hari masih menunggu konfirmasi bulan ini
          </p>
          <p className="text-xs text-violet-500 dark:text-violet-400 mt-1">
            Jika tidak dikonfirmasi sebelum rekap, akan otomatis menjadi tidak efektif.
          </p>
        </div>
      )}
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-xs", valueClass)}>{value}</span>
    </div>
  );
}
