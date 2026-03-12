import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CalendarIcon, ChevronRight, Plus, Clock, MapPin, FileText,
  GraduationCap, Loader2, Trash2, X, CheckCircle2, BookOpen, Star, Users
} from "lucide-react";
import ExamParticipantsDialog, { ParticipantCountBadge } from "@/components/ExamParticipants";
import { format, parseISO, isFuture, isToday } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ExamScheduleType = "tahsin_dasar_ke_lanjutan" | "tahsin_lanjutan_ke_tahfizh";

export interface ExamSchedule {
  id: string;
  jenis_ujian: ExamScheduleType;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string | null;
  lokasi: string;
  keterangan: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
export const EXAM_TYPE_CONFIG: Record<ExamScheduleType, {
  label: string;
  shortLabel: string;
  from: string;
  to: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof GraduationCap;
}> = {
  tahsin_dasar_ke_lanjutan: {
    label: "Ujian Kenaikan Tahsin Dasar → Tahsin Lanjutan",
    shortLabel: "Tahsin Dasar → Lanjutan",
    from: "Tahsin Dasar",
    to: "Tahsin Lanjutan",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: BookOpen,
  },
  tahsin_lanjutan_ke_tahfizh: {
    label: "Ujian Kenaikan Tahsin Lanjutan → Tahfizh",
    shortLabel: "Tahsin Lanjutan → Tahfizh",
    from: "Tahsin Lanjutan",
    to: "Tahfizh",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: Star,
  },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useExamSchedules = () =>
  useQuery({
    queryKey: ["exam_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_schedules")
        .select("*")
        .order("tanggal", { ascending: true })
        .order("waktu_mulai", { ascending: true });
      if (error) throw error;
      return data as ExamSchedule[];
    },
  });

const useAddExamSchedule = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Omit<ExamSchedule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("exam_schedules")
        .insert({ ...payload, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as ExamSchedule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exam_schedules"] }),
  });
};

const useDeleteExamSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("exam_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exam_schedules"] }),
  });
};

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  jenis_ujian: "" as ExamScheduleType | "",
  tanggal: undefined as Date | undefined,
  waktu_mulai: "",
  waktu_selesai: "",
  lokasi: "",
  keterangan: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const ExamSchedulePage = () => {
  const { data: schedules = [], isLoading } = useExamSchedules();
  const addSchedule = useAddExamSchedule();
  const deleteSchedule = useDeleteExamSchedule();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const upcoming = schedules.filter(
    s => isFuture(parseISO(s.tanggal)) || isToday(parseISO(s.tanggal))
  );
  const past = schedules.filter(
    s => !isFuture(parseISO(s.tanggal)) && !isToday(parseISO(s.tanggal))
  );

  const resetForm = () => setForm({ ...EMPTY_FORM });

  const handleSubmit = async () => {
    if (!form.jenis_ujian || !form.tanggal || !form.waktu_mulai || !form.lokasi) {
      toast({
        title: "Form tidak lengkap",
        description: "Isi jenis ujian, tanggal, waktu mulai, dan lokasi.",
        variant: "destructive",
      });
      return;
    }
    await addSchedule.mutateAsync({
      jenis_ujian: form.jenis_ujian,
      tanggal: format(form.tanggal, "yyyy-MM-dd"),
      waktu_mulai: form.waktu_mulai,
      waktu_selesai: form.waktu_selesai || null,
      lokasi: form.lokasi,
      keterangan: form.keterangan,
      created_by: null,
    });
    toast({
      title: "Jadwal berhasil dibuat",
      description: `${EXAM_TYPE_CONFIG[form.jenis_ujian].shortLabel} — ${format(form.tanggal, "dd MMMM yyyy", { locale: idLocale })}`,
    });
    resetForm();
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteSchedule.mutateAsync(id);
    setDeletingId(null);
    toast({ title: "Jadwal dihapus" });
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Jadwal Ujian Kenaikan</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,hsl(43_74%_49%),transparent)]" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Jadwal Ujian Kenaikan Tahsin</h1>
            <p className="text-primary-foreground/70 text-sm">
              Kelola jadwal ujian kenaikan level Tahsin Dasar & Tahsin Lanjutan
            </p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/30 border backdrop-blur-sm flex-shrink-0"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Jadwal
          </Button>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-2xl border border-border p-12 text-center"
        >
          <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Belum ada jadwal ujian</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Buat jadwal ujian kenaikan level untuk menginformasikan kepada semua guru.
          </p>
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Jadwal Pertama
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Jadwal Mendatang ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((s, i) => (
                  <ScheduleCard key={s.id} schedule={s} index={i}
                    onDelete={handleDelete} deletingId={deletingId} isUpcoming />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />
                Riwayat Ujian ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((s, i) => (
                  <ScheduleCard key={s.id} schedule={s} index={i}
                    onDelete={handleDelete} deletingId={deletingId} isUpcoming={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Buat Jadwal Ujian Kenaikan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Jenis ujian */}
            <div className="space-y-1.5">
              <Label>Jenis Ujian <span className="text-destructive">*</span></Label>
              <Select
                value={form.jenis_ujian}
                onValueChange={(v) => setForm(f => ({ ...f, jenis_ujian: v as ExamScheduleType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis ujian kenaikan..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EXAM_TYPE_CONFIG) as [ExamScheduleType, typeof EXAM_TYPE_CONFIG[ExamScheduleType]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                        <span>{cfg.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preview badge */}
              <AnimatePresence>
                {form.jenis_ujian && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {(() => {
                      const cfg = EXAM_TYPE_CONFIG[form.jenis_ujian];
                      const TypeIcon = cfg.icon;
                      return (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border mt-1 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {cfg.from}
                          <ChevronRight className="w-3 h-3" />
                          {cfg.to}
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tanggal */}
            <div className="space-y-1.5">
              <Label>Tanggal <span className="text-destructive">*</span></Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !form.tanggal && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.tanggal
                      ? format(form.tanggal, "dd MMMM yyyy", { locale: idLocale })
                      : "Pilih tanggal ujian"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.tanggal}
                    onSelect={(d) => { setForm(f => ({ ...f, tanggal: d })); setCalendarOpen(false); }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Waktu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Waktu Mulai <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="08:00"
                    maxLength={5}
                    value={form.waktu_mulai}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9]/g, "");
                      if (v.length >= 3) v = v.slice(0, 2) + ":" + v.slice(2, 4);
                      setForm(f => ({ ...f, waktu_mulai: v }));
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Waktu Selesai</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="10:00"
                    maxLength={5}
                    value={form.waktu_selesai}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9]/g, "");
                      if (v.length >= 3) v = v.slice(0, 2) + ":" + v.slice(2, 4);
                      setForm(f => ({ ...f, waktu_selesai: v }));
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Lokasi */}
            <div className="space-y-1.5">
              <Label>Lokasi / Ruangan <span className="text-destructive">*</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Contoh: Aula Utama, Ruang 12..."
                  value={form.lokasi}
                  onChange={(e) => setForm(f => ({ ...f, lokasi: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <Label>Keterangan / Catatan</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  placeholder="Informasi tambahan untuk peserta ujian..."
                  value={form.keterangan}
                  onChange={(e) => setForm(f => ({ ...f, keterangan: e.target.value }))}
                  className="pl-9 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={addSchedule.isPending}>
              {addSchedule.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Simpan Jadwal</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Schedule Card ─────────────────────────────────────────────────────────────
interface ScheduleCardProps {
  schedule: ExamSchedule;
  index: number;
  onDelete: (id: string) => void;
  deletingId: string | null;
  isUpcoming: boolean;
}

const ScheduleCard = ({ schedule: s, index, onDelete, deletingId, isUpcoming }: ScheduleCardProps) => {
  const cfg = EXAM_TYPE_CONFIG[s.jenis_ujian];
  const dateObj = parseISO(s.tanggal);
  const isToday_ = isToday(dateObj);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className={cn(
          "bg-card rounded-2xl border shadow-sm overflow-hidden transition-all",
          isUpcoming ? "border-border hover:shadow-md" : "border-border/60 opacity-70"
        )}
      >
        <div className="flex items-start gap-4 p-5">
          {/* Type icon */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.border}`}>
            <cfg.icon className={`w-6 h-6 ${cfg.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex flex-wrap items-start gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                {cfg.shortLabel}
              </span>
              {isToday_ && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse">
                  Hari ini!
                </span>
              )}
              {/* Participant badge */}
              <ParticipantCountBadge
                scheduleId={s.id}
                color={`${cfg.bg} ${cfg.color} ${cfg.border}`}
              />
            </div>

            {/* Info row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">
                  {format(dateObj, "EEEE, dd MMMM yyyy", { locale: idLocale })}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {s.waktu_mulai.slice(0, 5)}
                {s.waktu_selesai && ` – ${s.waktu_selesai.slice(0, 5)}`}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {s.lokasi}
              </span>
            </div>

            {/* Keterangan */}
            {s.keterangan && (
              <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {s.keterangan}
              </p>
            )}

            {/* Participants button */}
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setParticipantsOpen(true)}
                className={cn(
                  "h-8 text-xs gap-1.5 border",
                  cfg.border,
                  cfg.color,
                  cfg.bg,
                  "hover:opacity-80"
                )}
              >
                <Users className="w-3.5 h-3.5" />
                Kelola Peserta
              </Button>
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={() => onDelete(s.id)}
            disabled={deletingId === s.id}
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
          >
            {deletingId === s.id
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Participants dialog */}
      <ExamParticipantsDialog
        schedule={s}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
      />
    </>
  );
};

export default ExamSchedulePage;
