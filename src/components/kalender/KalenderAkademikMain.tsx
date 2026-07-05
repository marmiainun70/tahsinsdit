import { useState, useMemo } from "react";
import { format, addMonths, subMonths, isSameDay, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { useCalendarDays, useAcademicYears, useSyncHolidays, useRunMonthlyRecap, CalendarDay } from "@/hooks/useAcademicCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { DayCell, generateCalendarGrid, CalendarLegend } from "@/components/kalender/CalendarDayCell";
import { CalendarSidebar } from "@/components/kalender/CalendarSidebar";
import { SingleDayEditPanel, MultipleDayEditPanel, DateRangeForm } from "@/components/kalender/CalendarEditPanels";
import { AcademicYearManager } from "@/components/kalender/AcademicYearManager";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarRange,
  MousePointerClick,
  CheckSquare,
  ClipboardCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function KalenderAkademikMain() {
  const { user, profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showRangeForm, setShowRangeForm] = useState(false);

  const { data: calendarDays = [], isLoading } = useCalendarDays(currentMonth);
  const { data: years } = useAcademicYears();
  const syncHolidays = useSyncHolidays();
  const runRecap = useRunMonthlyRecap();

  // Map tanggal → CalendarDay untuk akses cepat
  const dayMap = useMemo(() => {
    const m: Record<string, CalendarDay> = {};
    for (const d of calendarDays) {
      m[d.tanggal] = d;
    }
    return m;
  }, [calendarDays]);

  const calendarGrid = generateCalendarGrid(currentMonth);

  // Jumlah hari menunggu konfirmasi bulan ini
  const pendingCount = calendarDays.filter((d) => d.status === "menunggu_konfirmasi").length;

  // Tahun kalender yang aktif (untuk sinkronisasi)
  const activeYears = useMemo(() => {
    if (!years) return [currentMonth.getFullYear()];
    const active = years.filter((y) => y.status === "aktif");
    if (active.length === 0) return [currentMonth.getFullYear()];
    const yearNums = new Set<number>();
    active.forEach((y) => {
      yearNums.add(new Date(y.tanggal_mulai).getFullYear());
      yearNums.add(new Date(y.tanggal_selesai).getFullYear());
    });
    return Array.from(yearNums);
  }, [years, currentMonth]);

  // Handler klik hari
  const handleDayClick = (date: Date) => {
    if (isMultiSelectMode) {
      setSelectedDates((prev) => {
        const exists = prev.some((d) => isSameDay(d, date));
        if (exists) return prev.filter((d) => !isSameDay(d, date));
        return [...prev, date];
      });
    } else {
      setSelectedDate((prev) => (prev && isSameDay(prev, date) ? null : date));
      setShowRangeForm(false);
    }
  };

  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode((prev) => !prev);
    setSelectedDates([]);
    setSelectedDate(null);
    setShowRangeForm(false);
  };

  const handleSync = async () => {
    if (!user) return;
    await syncHolidays.mutateAsync({
      years: activeYears,
      userId: user.id,
      userRole: profile?.role ?? "koordinator",
    });
  };

  const handleRecap = async () => {
    if (!user) return;
    await runRecap.mutateAsync({ month: currentMonth, changedBy: user.id });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kalender Akademik Pembinaan</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pusat pengaturan hari efektif tahsin sebagai acuan seluruh sistem
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/kalender-akademik/menunggu-konfirmasi">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 relative">
                <ClipboardCheck className="w-3.5 h-3.5" />
                Menunggu Konfirmasi
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/kalender-akademik/riwayat-sinkronisasi">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Riwayat Sinkronisasi
              </Button>
            </Link>
          </div>
        </div>

        {/* Banner peringatan menunggu konfirmasi */}
        {pendingCount > 0 && (
          <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                {pendingCount} hari menunggu konfirmasi bulan ini
              </p>
              <p className="text-xs text-violet-500 dark:text-violet-400">
                Konfirmasi sebelum rekap bulanan agar status tidak otomatis jatuh ke tidak efektif.
              </p>
            </div>
            <Link to="/kalender-akademik/menunggu-konfirmasi">
              <Button size="sm" variant="outline" className="text-xs border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 shrink-0">
                Konfirmasi
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Kolom Kiri: Kalender */}
          <div className="space-y-4">
            {/* Toolbar Kalender */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Navigasi Bulan */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-semibold min-w-[140px] text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: id })}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                {/* Mode Pilih Banyak */}
                <Button
                  variant={isMultiSelectMode ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={handleToggleMultiSelect}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {isMultiSelectMode ? `${selectedDates.length} dipilih` : "Pilih Banyak"}
                </Button>

                {/* Form Rentang Tanggal */}
                <Button
                  variant={showRangeForm ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    setShowRangeForm((p) => !p);
                    setIsMultiSelectMode(false);
                    setSelectedDate(null);
                  }}
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  Rentang Tanggal
                </Button>

                {/* Sinkronisasi */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={handleSync}
                  disabled={syncHolidays.isPending}
                >
                  {syncHolidays.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sinkronkan Libur
                </Button>

                {/* Rekap Bulanan */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950/30"
                      disabled={runRecap.isPending}
                    >
                      {runRecap.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ClipboardCheck className="w-3.5 h-3.5" />
                      )}
                      Rekap Bulanan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Lakukan Rekap Bulanan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini akan memproses kalender bulan ini. Semua hari libur yang masih berstatus <strong>"Menunggu Konfirmasi"</strong> akan otomatis diubah menjadi <strong>"Tidak Efektif"</strong> agar target siswa tidak memberatkan.
                        <br /><br />
                        Jangan khawatir, jika ada kekeliruan, Anda tetap bisa mengubah hari tersebut kembali kapan pun meskipun rekap sudah dilakukan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRecap} className="bg-amber-600 hover:bg-amber-700 text-white">
                        Lanjutkan Rekap
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Grid Kalender */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Header Hari */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/50">
                {DAY_HEADERS.map((day) => (
                  <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Loading */}
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-0.5 p-2 bg-muted/20">
                  {calendarGrid.map((date) => {
                    const dateKey = format(date, "yyyy-MM-dd");
                    const calendarDay = dayMap[dateKey];
                    const isSelected = isMultiSelectMode
                      ? selectedDates.some((d) => isSameDay(d, date))
                      : selectedDate !== null && isSameDay(date, selectedDate);

                    return (
                      <DayCell
                        key={dateKey}
                        date={date}
                        calendarDay={calendarDay}
                        currentMonth={currentMonth}
                        isSelected={isSelected}
                        isMultiSelectMode={isMultiSelectMode}
                        onClick={handleDayClick}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legenda */}
            <CalendarLegend />

            {/* Panel Edit (di bawah kalender, bukan modal) */}
            {showRangeForm && (
              <DateRangeForm onClose={() => setShowRangeForm(false)} />
            )}
            {!showRangeForm && isMultiSelectMode && selectedDates.length > 0 && (
              <MultipleDayEditPanel
                selectedDates={selectedDates}
                onClose={() => {
                  setSelectedDates([]);
                  setIsMultiSelectMode(false);
                }}
              />
            )}
            {!showRangeForm && !isMultiSelectMode && selectedDate && (
              <SingleDayEditPanel
                selectedDate={selectedDate}
                calendarDay={dayMap[format(selectedDate, "yyyy-MM-dd")]}
                onClose={() => setSelectedDate(null)}
              />
            )}
          </div>

          {/* Kolom Kanan: Sidebar */}
          <div className="space-y-4">
            <CalendarSidebar month={currentMonth} days={calendarDays} />
            <Separator />
            <AcademicYearManager />
          </div>
        </div>
      </div>
    </div>
  );
}
