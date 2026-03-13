import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useExamSchedules, EXAM_TYPE_CONFIG } from "@/pages/ExamSchedule";
import { useExamParticipants } from "@/components/ExamParticipants";
import ExamParticipantsDialog from "@/components/ExamParticipants";
import ExamReportPDF from "@/components/ExamReportPDF";
import type { ParticipantRow } from "@/components/ExamReportPDF";
import { format, parseISO, isToday, isFuture } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CalendarIcon, Clock, MapPin, FileText, GraduationCap,
  ChevronRight, Users, CheckCircle2, XCircle, Loader2,
  ArrowLeft, Save, Search, X, ClipboardList, AlertCircle, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { LEVEL_COLORS } from "@/hooks/useSupabaseData";
import type { Database } from "@/integrations/supabase/types";

type ExamResult = Database["public"]["Enums"]["exam_result"];
type ReadingLevel = Database["public"]["Enums"]["reading_level"];

// ─── Hooks ────────────────────────────────────────────────────────────────────
const useExamResults = (scheduleId: string) =>
  useQuery({
    queryKey: ["exam_results_by_schedule", scheduleId],
    queryFn: async () => {
      // exam_records keyed by student_id — latest one per student
      const { data, error } = await supabase
        .from("exam_records")
        .select("id, student_id, hasil, tanggal, catatan, kelancaran, makhraj, tajwid, adab")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Return a Map: student_id → latest record
      const map = new Map<string, typeof data[0]>();
      for (const row of data ?? []) {
        if (!map.has(row.student_id)) map.set(row.student_id, row);
      }
      return map;
    },
    enabled: !!scheduleId,
  });

// Upsert hasil ujian (hasil only — quick inline result)
const useUpsertResult = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      studentId,
      scheduleId,
      hasil,
      tanggal,
      levelDiuji,
    }: {
      studentId: string;
      scheduleId: string;
      hasil: ExamResult;
      tanggal: string;
      levelDiuji: ReadingLevel;
    }) => {
      // Insert a new exam_record marking pass/fail
      const { error } = await supabase.from("exam_records").insert({
        student_id: studentId,
        hasil,
        tanggal,
        level_diuji: levelDiuji,
        kelancaran: 0,
        makhraj: 0,
        tajwid: 0,
        adab: 0,
        catatan: `Dicatat dari jadwal ujian: ${scheduleId}`,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["exam_results_by_schedule", vars.scheduleId] });
    },
  });
};

// ─── Component ────────────────────────────────────────────────────────────────
const ExamScheduleDetailPage = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { data: schedules = [], isLoading: loadingSchedules } = useExamSchedules();
  const schedule = schedules.find((s) => s.id === scheduleId);

  const {
    data: participants = [],
    isLoading: loadingParticipants,
  } = useExamParticipants(scheduleId ?? "");

  const {
    data: resultsMap = new Map(),
    isLoading: loadingResults,
  } = useExamResults(scheduleId ?? "");

  const upsertResult = useUpsertResult();

  const [search, setSearch] = useState("");
  const [filterHasil, setFilterHasil] = useState<"all" | "Lulus" | "Tidak Lulus" | "belum">("all");
  const [participantsOpen, setParticipantsOpen] = useState(false);
  // Track pending result changes (studentId → hasil)
  const [pendingResults, setPendingResults] = useState<Map<string, ExamResult>>(new Map());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const isLoading = loadingSchedules || loadingParticipants || loadingResults;

  const filteredParticipants = useMemo(() => {
    let list = participants;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.students.nama.toLowerCase().includes(q) ||
          p.students.rombel.toLowerCase().includes(q)
      );
    }
    if (filterHasil !== "all") {
      list = list.filter((p) => {
        const saved = resultsMap.get(p.student_id);
        const pending = pendingResults.get(p.student_id);
        const current = pending ?? saved?.hasil;
        if (filterHasil === "belum") return !current;
        return current === filterHasil;
      });
    }
    return list;
  }, [participants, search, filterHasil, resultsMap, pendingResults]);

  const stats = useMemo(() => {
    const total = participants.length;
    let lulus = 0, tidakLulus = 0, belum = 0;
    for (const p of participants) {
      const saved = resultsMap.get(p.student_id);
      const pending = pendingResults.get(p.student_id);
      const current = pending ?? saved?.hasil;
      if (current === "Lulus") lulus++;
      else if (current === "Tidak Lulus") tidakLulus++;
      else belum++;
    }
    return { total, lulus, tidakLulus, belum };
  }, [participants, resultsMap, pendingResults]);

  const handleSetResult = (studentId: string, hasil: ExamResult) => {
    setPendingResults((prev) => {
      const next = new Map(prev);
      const saved = resultsMap.get(studentId);
      // If clicking same value as saved, treat as "clear pending"
      if (saved?.hasil === hasil) {
        next.delete(studentId);
      } else {
        next.set(studentId, hasil);
      }
      return next;
    });
  };

  const handleSaveOne = async (studentId: string) => {
    if (!schedule || !scheduleId) return;
    const hasil = pendingResults.get(studentId);
    if (!hasil) return;
    setSavingIds((prev) => new Set(prev).add(studentId));
    const cfg = EXAM_TYPE_CONFIG[schedule.jenis_ujian];
    try {
      await upsertResult.mutateAsync({
        studentId,
        scheduleId,
        hasil,
        tanggal: schedule.tanggal,
        levelDiuji: cfg.from as ReadingLevel,
      });
      setPendingResults((prev) => {
        const next = new Map(prev);
        next.delete(studentId);
        return next;
      });
      toast({
        title: hasil === "Lulus" ? "✅ Lulus dicatat" : "❌ Tidak Lulus dicatat",
        description: `Hasil ujian siswa berhasil disimpan.`,
      });
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  const handleSaveAll = async () => {
    if (!schedule || !scheduleId || pendingResults.size === 0) return;
    const cfg = EXAM_TYPE_CONFIG[schedule.jenis_ujian];
    const ids = [...pendingResults.keys()];
    setSavingIds(new Set(ids));
    try {
      await Promise.all(
        ids.map((studentId) =>
          upsertResult.mutateAsync({
            studentId,
            scheduleId,
            hasil: pendingResults.get(studentId)!,
            tanggal: schedule.tanggal,
            levelDiuji: cfg.from as ReadingLevel,
          })
        )
      );
      setPendingResults(new Map());
      toast({
        title: "Semua hasil disimpan",
        description: `${ids.length} hasil ujian berhasil dicatat.`,
      });
    } catch {
      toast({ title: "Gagal menyimpan sebagian", variant: "destructive" });
    } finally {
      setSavingIds(new Set());
    }
  };

  if (!isLoading && !schedule) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Jadwal ujian tidak ditemukan.</p>
        <Button variant="outline" onClick={() => navigate("/jadwal-ujian")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const cfg = schedule ? EXAM_TYPE_CONFIG[schedule.jenis_ujian] : null;
  const TypeIcon = cfg?.icon ?? GraduationCap;
  const dateObj = schedule ? parseISO(schedule.tanggal) : null;
  const isPast = dateObj ? (!isFuture(dateObj) && !isToday(dateObj)) : false;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/jadwal-ujian" className="hover:text-primary transition-colors">
          Jadwal Ujian
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Detail Jadwal</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : schedule && cfg && dateObj ? (
        <>
          {/* ── Header Card ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl border p-6 relative overflow-hidden",
              cfg.bg, cfg.border
            )}
          >
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_80%_20%,currentColor,transparent)]" />
            <div className="relative z-10 flex flex-col sm:flex-row gap-4">
              {/* Back button */}
              <button
                onClick={() => navigate("/jadwal-ujian")}
                className={cn(
                  "self-start flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                  cfg.border, cfg.color, "bg-white/60 hover:bg-white/80 sm:hidden"
                )}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>

              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border bg-white/70",
                cfg.border
              )}>
                <TypeIcon className={cn("w-7 h-7", cfg.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full border",
                    cfg.bg, cfg.color, cfg.border, "bg-white/70"
                  )}>
                    {cfg.shortLabel}
                  </span>
                  {isToday(dateObj) && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse">
                      Hari ini!
                    </span>
                  )}
                  {isPast && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                      Selesai
                    </span>
                  )}
                </div>

                <h1 className={cn("text-xl font-bold mb-3", cfg.color)}>
                  {cfg.label}
                </h1>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <span className={cn("flex items-center gap-1.5 font-medium", cfg.color)}>
                    <CalendarIcon className="w-4 h-4" />
                    {format(dateObj, "EEEE, dd MMMM yyyy", { locale: idLocale })}
                  </span>
                  <span className={cn("flex items-center gap-1.5", cfg.color, "opacity-80")}>
                    <Clock className="w-4 h-4" />
                    {schedule.waktu_mulai.slice(0, 5)}
                    {schedule.waktu_selesai && ` – ${schedule.waktu_selesai.slice(0, 5)}`}
                  </span>
                  <span className={cn("flex items-center gap-1.5", cfg.color, "opacity-80")}>
                    <MapPin className="w-4 h-4" />
                    {schedule.lokasi}
                  </span>
                </div>

                {schedule.keterangan && (
                  <p className={cn("mt-3 text-sm flex items-start gap-2 opacity-80", cfg.color)}>
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {schedule.keterangan}
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate("/jadwal-ujian")}
                className={cn(
                  "hidden sm:flex self-start items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                  cfg.border, cfg.color, "bg-white/60 hover:bg-white/80"
                )}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali
              </button>
            </div>
          </motion.div>

          {/* ── Stats ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Peserta", value: stats.total, icon: Users, color: "text-primary", bg: "bg-primary/10" },
              { label: "Lulus", value: stats.lulus, icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "Tidak Lulus", value: stats.tidakLulus, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
              { label: "Belum Diisi", value: stats.belum, icon: ClipboardList, color: "text-amber-700", bg: "bg-amber-50" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div>
                  <div className={cn("text-xl font-bold leading-none", s.color)}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Participants Table ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            {/* Table header toolbar */}
            <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <ClipboardList className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-semibold text-foreground">Daftar Peserta & Hasil Ujian</span>
                {pendingResults.size > 0 && (
                  <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    {pendingResults.size} belum disimpan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Filter tabs */}
                <div className="flex gap-1 bg-muted rounded-lg p-0.5 text-xs">
                  {(["all", "Lulus", "Tidak Lulus", "belum"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterHasil(f)}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap",
                        filterHasil === f
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f === "all" ? "Semua" : f === "belum" ? "Belum diisi" : f}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setParticipantsOpen(true)}
                  className="h-8 text-xs gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Kelola Peserta
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-border">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau rombel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Save all bar */}
            <AnimatePresence>
              {pendingResults.size > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm text-amber-800 flex-1">
                      <span className="font-semibold">{pendingResults.size} perubahan</span> belum disimpan
                    </span>
                    <Button
                      size="sm"
                      onClick={handleSaveAll}
                      disabled={upsertResult.isPending}
                      className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {upsertResult.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <><Save className="w-3.5 h-3.5 mr-1" />Simpan Semua</>
                      }
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            {participants.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">Belum ada peserta</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Tambahkan peserta ujian terlebih dahulu.
                </p>
                <Button size="sm" variant="outline" onClick={() => setParticipantsOpen(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Kelola Peserta
                </Button>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Tidak ada data yang cocok.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {filteredParticipants.map((p, i) => {
                    const savedResult = resultsMap.get(p.student_id);
                    const pending = pendingResults.get(p.student_id);
                    const currentHasil: ExamResult | undefined = pending ?? savedResult?.hasil;
                    const isSaving = savingIds.has(p.student_id);
                    const hasPending = pendingResults.has(p.student_id);

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.25) }}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors",
                          hasPending && "bg-amber-50/50"
                        )}
                      >
                        {/* Rank */}
                        <span className="text-xs text-muted-foreground/60 w-5 text-right flex-shrink-0">
                          {i + 1}
                        </span>

                        {/* Avatar */}
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                          currentHasil === "Lulus"
                            ? "bg-emerald-100 text-emerald-700"
                            : currentHasil === "Tidak Lulus"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {p.students.nama.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground truncate">
                              {p.students.nama}
                            </span>
                            {hasPending && (
                              <span className="text-xs text-amber-600 font-medium">• belum disimpan</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              Kelas {p.students.kelas} · Rombel {p.students.rombel}
                            </span>
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded-md font-medium",
                              LEVEL_COLORS[p.students.level as ReadingLevel]
                            )}>
                              {p.students.level}
                            </span>
                          </div>
                        </div>

                        {/* Result buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleSetResult(p.student_id, "Lulus")}
                            disabled={isSaving}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              currentHasil === "Lulus"
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                : "bg-background text-muted-foreground border-border hover:border-emerald-400 hover:text-emerald-600"
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Lulus
                          </button>
                          <button
                            onClick={() => handleSetResult(p.student_id, "Tidak Lulus")}
                            disabled={isSaving}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                              currentHasil === "Tidak Lulus"
                                ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
                                : "bg-background text-muted-foreground border-border hover:border-destructive/50 hover:text-destructive"
                            )}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Tidak Lulus
                          </button>

                          {/* Save individual */}
                          {hasPending && (
                            <Button
                              size="sm"
                              onClick={() => handleSaveOne(p.student_id)}
                              disabled={isSaving}
                              className="h-7 w-7 p-0 rounded-full"
                            >
                              {isSaving
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Save className="w-3.5 h-3.5" />
                              }
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Footer summary */}
            {participants.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">{stats.lulus}</span> Lulus
                  </span>
                  <span className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                    <span className="font-semibold text-destructive">{stats.tidakLulus}</span> Tidak Lulus
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-semibold text-amber-700">{stats.belum}</span> Belum diisi
                  </span>
                </div>

                {pendingResults.size > 0 && (
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={upsertResult.isPending}
                    className="h-8 text-xs"
                  >
                    {upsertResult.isPending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      : <Save className="w-3.5 h-3.5 mr-1.5" />
                    }
                    Simpan Semua ({pendingResults.size})
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </>
      ) : null}

      {/* Participants management dialog */}
      {schedule && (
        <ExamParticipantsDialog
          schedule={schedule}
          open={participantsOpen}
          onOpenChange={setParticipantsOpen}
        />
      )}
    </div>
  );
};

export default ExamScheduleDetailPage;
