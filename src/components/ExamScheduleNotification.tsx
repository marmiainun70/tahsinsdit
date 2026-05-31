import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { GraduationCap, CalendarIcon, Clock, MapPin, X, ChevronRight, BookOpen, Star } from "lucide-react";
import { format, parseISO, isFuture, isToday, differenceInCalendarDays } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { ExamSchedule, ExamScheduleType } from "@/pages/ExamSchedule";
import { EXAM_TYPE_CONFIG } from "@/pages/ExamSchedule";
import { useExamSchedules } from "@/pages/ExamSchedule";

// â”€â”€â”€ Toast-style new schedule notification (shown on realtime insert) â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface NewScheduleToastProps {
  schedule: ExamSchedule;
  onClose: () => void;
}

const NewScheduleToast = ({ schedule: s, onClose }: NewScheduleToastProps) => {
  const cfg = EXAM_TYPE_CONFIG[s.jenis_ujian];

  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
    >
      {/* Accent top bar */}
      <div className={`h-1 w-full ${
        s.jenis_ujian === "tahsin_dasar_ke_lanjutan"
          ? "bg-orange-400"
          : s.jenis_ujian === "tahsin_lanjutan_ke_tahfizh"
          ? "bg-purple-500"
          : "bg-emerald-500"
      }`} />

      <div className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.border}`}>
          <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-bold text-primary">Jadwal Ujian Baru</span>
            <span className="text-muted-foreground/40 text-xs">â€¢</span>
            <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.shortLabel}</span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight">
            {format(parseISO(s.tanggal), "EEEE, dd MMM yyyy", { locale: idLocale })}
          </p>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {s.waktu_mulai.slice(0, 5)}
              {s.waktu_selesai && ` â€“ ${s.waktu_selesai.slice(0, 5)}`}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {s.lokasi}
            </span>
          </div>
          {s.nama_siswa && (
            <p className="text-xs text-foreground mt-1">
              Siswa: <span className="font-semibold">{s.nama_siswa}</span>
            </p>
          )}
          {s.keterangan && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{s.keterangan}</p>
          )}
          <Link
            to="/jadwal-ujian"
            className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-2 hover:underline"
            onClick={onClose}
          >
            Lihat Jadwal <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// â”€â”€â”€ Upcoming exam banner (persistent, shown when upcoming exams exist) â”€â”€â”€â”€â”€â”€â”€â”€
const UpcomingExamBanner = () => {
  const { data: schedules = [] } = useExamSchedules();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const upcoming = schedules.filter(
    s => (isFuture(parseISO(s.tanggal)) || isToday(parseISO(s.tanggal)))
      && !dismissed.includes(s.id)
  );

  if (upcoming.length === 0) return null;

  // Show the most imminent one
  const next = upcoming[0];
  const cfg = EXAM_TYPE_CONFIG[next.jenis_ujian];
  const examDate = parseISO(next.tanggal);
  const daysLeft = differenceInCalendarDays(examDate, new Date());
  const urgencyLabel = isToday(examDate)
    ? "Hari ini!"
    : daysLeft === 1
    ? "Besok!"
    : `${daysLeft} hari lagi`;
  const isUrgent = daysLeft <= 3;

  return (
    <AnimatePresence>
      <motion.div
        key={next.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`rounded-2xl border px-4 py-3 flex items-center gap-3 flex-wrap ${
          isUrgent
            ? "bg-orange-50 border-orange-200"
            : next.jenis_ujian === "tahsin_lanjutan_ke_tahfizh"
            ? "bg-purple-50 border-purple-200"
            : "bg-emerald-50 border-emerald-200"
        }`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.border}`}>
          <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {cfg.shortLabel}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isUrgent ? "bg-orange-200 text-orange-800" : "bg-muted text-muted-foreground"
            }`}>
              {urgencyLabel}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {format(parseISO(next.tanggal), "EEEE, dd MMMM yyyy", { locale: idLocale })}
            {" آ· "}<span className="text-muted-foreground">{next.waktu_mulai.slice(0, 5)}</span>
            {" آ· "}<span className="text-muted-foreground">{next.lokasi}</span>
          </p>
          {next.nama_siswa && (
            <p className="text-xs text-foreground mt-1">
              Siswa: <span className="font-semibold">{next.nama_siswa}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {upcoming.length > 1 && (
            <span className="text-xs text-muted-foreground">+{upcoming.length - 1} lainnya</span>
          )}
          <Link
            to="/jadwal-ujian"
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
              isUrgent
                ? "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200"
                : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            }`}
          >
            Lihat Semua
          </Link>
          <button
            onClick={() => setDismissed(d => [...d, next.id])}
            className="p-1.5 rounded-xl hover:bg-black/10 transition-colors text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// â”€â”€â”€ Realtime listener + toast queue (rendered in Layout) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ExamScheduleRealtimeProvider = () => {
  const qc = useQueryClient();
  const [toasts, setToasts] = useState<ExamSchedule[]>([]);
  // Track schedules we've already seen on mount so we don't toast them
  const seenOnMount = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  // Mark currently existing schedules on first load
  const { data: existing = [] } = useExamSchedules();
  useEffect(() => {
    if (!initialized.current && existing.length >= 0) {
      existing.forEach(s => seenOnMount.current.add(s.id));
      initialized.current = true;
    }
  }, [existing]);

  useEffect(() => {
    const channel = supabase
      .channel("exam_schedules_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "exam_schedules" },
        (payload) => {
          const newSchedule = payload.new as ExamSchedule;
          // Only show toast for genuinely new inserts after mount
          if (initialized.current && !seenOnMount.current.has(newSchedule.id)) {
            setToasts(prev => [...prev, newSchedule]);
            qc.invalidateQueries({ queryKey: ["exam_schedules"] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "exam_schedules" },
        () => {
          qc.invalidateQueries({ queryKey: ["exam_schedules"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: "360px" }}
    >
      <AnimatePresence mode="sync">
        {toasts.map(s => (
          <NewScheduleToast
            key={s.id}
            schedule={s}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== s.id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export { UpcomingExamBanner };
export default ExamScheduleRealtimeProvider;

