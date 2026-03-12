import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStudents, IQRO_LEVELS, LEVEL_COLORS } from "@/hooks/useSupabaseData";
import type { ExamSchedule, ExamScheduleType } from "@/pages/ExamSchedule";
import { EXAM_TYPE_CONFIG } from "@/pages/ExamSchedule";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Users, Search, Loader2, UserCheck, UserX, CheckCircle2, X,
  GraduationCap, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

// ─── eligible levels per exam type ───────────────────────────────────────────
const ELIGIBLE_LEVELS: Record<ExamScheduleType, ReadingLevel[]> = {
  tahsin_dasar_ke_lanjutan: [
    "Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6", "Tahsin Dasar",
  ],
  tahsin_lanjutan_ke_tahfizh: ["Tahsin Lanjutan"],
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useExamParticipants = (scheduleId: string) =>
  useQuery({
    queryKey: ["exam_participants", scheduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_participants" as never)
        .select("*, students(id, nama, kelas, rombel, level)")
        .eq("schedule_id", scheduleId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Array<{
        id: string;
        schedule_id: string;
        student_id: string;
        created_at: string;
        students: { id: string; nama: string; kelas: number; rombel: string; level: ReadingLevel };
      }>;
    },
    enabled: !!scheduleId,
  });

const useSetParticipants = (scheduleId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      toAdd,
      toRemove,
    }: {
      toAdd: string[];
      toRemove: string[];
    }) => {
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from("exam_participants" as never)
          .delete()
          .eq("schedule_id", scheduleId)
          .in("student_id", toRemove);
        if (error) throw error;
      }
      if (toAdd.length > 0) {
        const rows = toAdd.map((sid) => ({
          schedule_id: scheduleId,
          student_id: sid,
          created_by: user?.id ?? null,
        }));
        const { error } = await supabase
          .from("exam_participants" as never)
          .insert(rows as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam_participants", scheduleId] });
    },
  });
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface ExamParticipantsDialogProps {
  schedule: ExamSchedule;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ExamParticipantsDialog = ({
  schedule,
  open,
  onOpenChange,
}: ExamParticipantsDialogProps) => {
  const cfg = EXAM_TYPE_CONFIG[schedule.jenis_ujian];
  const TypeIcon = cfg.icon;

  const { data: allStudents = [], isLoading: loadingStudents } = useStudents();
  const { data: currentParticipants = [], isLoading: loadingParticipants } =
    useExamParticipants(schedule.id);
  const setParticipants = useSetParticipants(schedule.id);

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterKelas, setFilterKelas] = useState<number | null>(null);
  const [showSelected, setShowSelected] = useState(false);

  // Initialize selection from current participants when dialog opens
  const participantIds = useMemo(
    () => new Set(currentParticipants.map((p) => p.student_id)),
    [currentParticipants]
  );

  // Sync selectedIds with participantIds when loaded
  useState(() => {
    setSelectedIds(new Set(participantIds));
  });

  // Eligible students based on exam type
  const eligibleLevels = ELIGIBLE_LEVELS[schedule.jenis_ujian];
  const eligibleStudents = useMemo(
    () => allStudents.filter((s) => eligibleLevels.includes(s.level as ReadingLevel)),
    [allStudents, eligibleLevels]
  );

  // Unique kelas from eligible students
  const kelasList = useMemo(
    () => [...new Set(eligibleStudents.map((s) => s.kelas))].sort((a, b) => a - b),
    [eligibleStudents]
  );

  // Filtered display list
  const filtered = useMemo(() => {
    let list = eligibleStudents;
    if (filterKelas !== null) list = list.filter((s) => s.kelas === filterKelas);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.rombel.toLowerCase().includes(q)
      );
    }
    if (showSelected) list = list.filter((s) => selectedIds.has(s.id));
    return list;
  }, [eligibleStudents, filterKelas, search, showSelected, selectedIds]);

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((s) => next.add(s.id));
      return next;
    });

  const deselectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((s) => next.delete(s.id));
      return next;
    });

  const handleSave = async () => {
    const toAdd = [...selectedIds].filter((id) => !participantIds.has(id));
    const toRemove = [...participantIds].filter((id) => !selectedIds.has(id));
    await setParticipants.mutateAsync({ toAdd, toRemove });
    toast({
      title: "Daftar peserta disimpan",
      description: `${selectedIds.size} siswa terdaftar sebagai peserta ujian.`,
    });
    onOpenChange(false);
  };

  const isLoading = loadingStudents || loadingParticipants;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${cfg.bg} ${cfg.border}`}>
              <TypeIcon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div>
              <div className="font-semibold">Daftar Peserta Ujian</div>
              <div className={`text-xs font-normal ${cfg.color}`}>{cfg.shortLabel}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 flex-1">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="px-6 py-3 bg-muted/30 border-b border-border flex-shrink-0 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Siswa eligible:</span>
                <span className="font-semibold text-foreground">{eligibleStudents.length}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Dipilih:</span>
                <span className="font-semibold text-emerald-700">{selectedIds.size}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span className="text-muted-foreground">Level ujian:</span>
                <span className={`font-semibold text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                  {cfg.from} → {cfg.to}
                </span>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 border-b border-border flex-shrink-0 space-y-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama siswa atau rombel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
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

              {/* Filters row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Kelas:</span>
                <button
                  onClick={() => setFilterKelas(null)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    filterKelas === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  Semua
                </button>
                {kelasList.map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilterKelas(k === filterKelas ? null : k)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors",
                      filterKelas === k
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    Kelas {k}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setShowSelected(!showSelected)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors",
                      showSelected
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-background text-muted-foreground border-border hover:border-emerald-300"
                    )}
                  >
                    <UserCheck className="w-3 h-3" />
                    Dipilih saja
                  </button>
                  <button
                    onClick={selectAll}
                    className="text-xs px-2.5 py-1 rounded-full border bg-background text-muted-foreground border-border hover:border-primary/50 transition-colors"
                  >
                    Pilih semua
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-xs px-2.5 py-1 rounded-full border bg-background text-muted-foreground border-border hover:border-destructive/50 transition-colors"
                  >
                    Hapus semua
                  </button>
                </div>
              </div>
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto px-6 py-3">
              {filtered.length === 0 ? (
                <div className="py-10 text-center">
                  <GraduationCap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {eligibleStudents.length === 0
                      ? "Tidak ada siswa dengan level yang sesuai."
                      : "Tidak ada siswa yang cocok dengan filter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {filtered.map((student, i) => {
                      const isSelected = selectedIds.has(student.id);
                      const wasParticipant = participantIds.has(student.id);
                      return (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          onClick={() => toggleStudent(student.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
                            isSelected
                              ? "bg-emerald-50 border-emerald-300 shadow-sm"
                              : "bg-card border-border hover:bg-muted/40 hover:border-border"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleStudent(student.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="pointer-events-none"
                          />

                          {/* Avatar */}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                            isSelected
                              ? "bg-emerald-500 text-white"
                              : "bg-gradient-hero text-primary-foreground"
                          )}>
                            {student.nama.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "text-sm font-medium truncate",
                                isSelected ? "text-emerald-800" : "text-foreground"
                              )}>
                                {student.nama}
                              </span>
                              {wasParticipant && !isSelected && (
                                <span className="text-xs text-muted-foreground">(dihapus)</span>
                              )}
                              {!wasParticipant && isSelected && (
                                <span className="text-xs text-emerald-600 font-medium">(baru)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                Kelas {student.kelas} · Rombel {student.rombel}
                              </span>
                              <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded-md font-medium",
                                LEVEL_COLORS[student.level as ReadingLevel]
                              )}>
                                {student.level}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <UserX className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border flex-shrink-0 flex items-center gap-3">
          <span className="text-sm text-muted-foreground flex-1">
            {selectedIds.size > 0 ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span><strong className="text-emerald-700">{selectedIds.size}</strong> siswa dipilih</span>
              </span>
            ) : (
              "Belum ada siswa dipilih"
            )}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={setParticipants.isPending || isLoading}
            className="min-w-28"
          >
            {setParticipants.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" />Simpan Peserta</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Participant count badge (for ScheduleCard) ───────────────────────────────
export const ParticipantCountBadge = ({ scheduleId, color }: { scheduleId: string; color: string }) => {
  const { data = [] } = useExamParticipants(scheduleId);
  if (data.length === 0) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
      color
    )}>
      <Users className="w-3 h-3" />
      {data.length} peserta
    </span>
  );
};

export default ExamParticipantsDialog;
