import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { id } from "date-fns/locale";
import { CalendarDay, StatusHari, JenisHari } from "@/hooks/useAcademicCalendar";
import { cn } from "@/lib/utils";

// ─── Konfigurasi Warna Status/Jenis ──────────────────────────────────────────

export const STATUS_CONFIG: Record<StatusHari, { label: string; bg: string; text: string; dot: string }> = {
  efektif: {
    label: "Efektif",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  tidak_efektif: {
    label: "Tidak Efektif",
    bg: "bg-slate-50 dark:bg-slate-800/40",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-400",
  },
  menunggu_konfirmasi: {
    label: "Menunggu Konfirmasi",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
  },
};

export const JENIS_CONFIG: Record<JenisHari, { label: string; color: string; badge: string }> = {
  reguler: { label: "Reguler", color: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  weekend: { label: "Akhir Pekan", color: "text-slate-500", badge: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  libur_nasional: { label: "Libur Nasional", color: "text-red-600", badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  cuti_bersama: { label: "Cuti Bersama", color: "text-amber-600", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  libur_semester: { label: "Libur Semester", color: "text-amber-600", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  libur_akhir_tahun: { label: "Libur Kenaikan Kelas / Akhir Tahun", color: "text-amber-600", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  kegiatan_sekolah: { label: "Kegiatan Sekolah/Yayasan", color: "text-blue-600", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  ujian: { label: "Ujian (Diliburkan)", color: "text-blue-600", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  lainnya: { label: "Lainnya", color: "text-slate-600", badge: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" },
};

// ─── Helper: Warna sel kalender ───────────────────────────────────────────────

export function getDayCellClass(day: CalendarDay | undefined, jenis: JenisHari | undefined): string {
  if (!day) return "";
  if (day.status === "menunggu_konfirmasi") return "bg-violet-50 border-violet-300 border-dashed dark:bg-violet-950/30 dark:border-violet-700";
  if (jenis === "libur_nasional") return "bg-red-50 dark:bg-red-950/30";
  if (jenis === "cuti_bersama" || jenis === "libur_semester" || jenis === "libur_akhir_tahun") return "bg-amber-50 dark:bg-amber-950/30";
  if (jenis === "kegiatan_sekolah" || jenis === "ujian") return "bg-blue-50 dark:bg-blue-950/30";
  if (jenis === "weekend" || day.status === "tidak_efektif") return "bg-slate-50 dark:bg-slate-800/30";
  if (day.status === "efektif") return "bg-emerald-50/60 dark:bg-emerald-950/20";
  return "";
}

// ─── Helper: Generate sel kalender (termasuk hari dari bulan lain untuk grid) ──

export function generateCalendarGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 }); // Senin
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

// ─── Komponen: Sel Hari Kalender ──────────────────────────────────────────────

interface DayCellProps {
  date: Date;
  calendarDay?: CalendarDay;
  currentMonth: Date;
  isSelected: boolean;
  isMultiSelectMode: boolean;
  onClick: (date: Date) => void;
}

export function DayCell({ date, calendarDay, currentMonth, isSelected, isMultiSelectMode, onClick }: DayCellProps) {
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const jenis = calendarDay?.jenis;
  const cellBg = calendarDay ? getDayCellClass(calendarDay, jenis) : "";

  return (
    <button
      type="button"
      onClick={() => onClick(date)}
      className={cn(
        "relative flex flex-col items-start justify-start p-1.5 min-h-[64px] rounded-lg border transition-all duration-150",
        "text-left w-full",
        inMonth ? "opacity-100" : "opacity-30",
        cellBg || "bg-background",
        today ? "ring-2 ring-primary ring-offset-1" : "border-border/50",
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-1 border-blue-400"
          : "hover:border-primary/50 hover:shadow-sm",
        isMultiSelectMode && "cursor-pointer",
        calendarDay?.status === "menunggu_konfirmasi" && "border-dashed border-violet-400"
      )}
    >
      <span
        className={cn(
          "text-sm font-semibold leading-none",
          today ? "text-primary" : inMonth ? "text-foreground" : "text-muted-foreground/60",
          calendarDay?.status === "tidak_efektif" && inMonth && "text-muted-foreground"
        )}
      >
        {format(date, "d")}
      </span>
      {calendarDay && inMonth && (
        <div className="mt-1 space-y-0.5 w-full overflow-hidden">
          {jenis && jenis !== "reguler" && jenis !== "weekend" && (
            <span
              className={cn(
                "text-[9px] font-medium leading-none px-1 py-0.5 rounded truncate block max-w-full",
                (JENIS_CONFIG[jenis] || JENIS_CONFIG.lainnya).badge
              )}
            >
              {(JENIS_CONFIG[jenis] || JENIS_CONFIG.lainnya).label}
            </span>
          )}
          {calendarDay.keterangan && (
            <span className="text-[9px] text-muted-foreground leading-none truncate block max-w-full">
              {calendarDay.keterangan}
            </span>
          )}
        </div>
      )}
      {isMultiSelectMode && isSelected && (
        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ─── Komponen: Label Legenda Warna ────────────────────────────────────────────

export function CalendarLegend() {
  const items = [
    { color: "bg-emerald-500", label: "Efektif" },
    { color: "bg-slate-400", label: "Tidak Efektif" },
    { color: "bg-red-500", label: "Libur Nasional" },
    { color: "bg-amber-500", label: "PTS/PAS/Cuti" },
    { color: "bg-blue-500", label: "Kegiatan Khusus" },
    { color: "bg-violet-500 border-2 border-dashed border-violet-400", label: "Menunggu Konfirmasi" },
  ];
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={cn("w-3 h-3 rounded-sm", item.color)} />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Helper: Format nama bulan Bahasa Indonesia ───────────────────────────────

export function formatBulanIndo(date: Date): string {
  return format(date, "MMMM yyyy", { locale: id });
}
