import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type {
  TransitionPreview,
  ClassMapping,
  AcademicYearTransition,
  AcademicYear,
  TransitionAlertData,
  TransitionExecuteInput,
  TransitionExecuteResult,
} from "@/types/academicTransition";

// ─── Query Keys ───────────────────────────────────────────────

const KEYS = {
  preview: (id: string) => ["transition-preview", id],
  suggestion: (id: string) => ["transition-suggestion", id],
  history: ["transition-history"],
  activeYear: ["academic-years-active-transition"],
};

// ─── Hook: Daftar Tahun Ajaran (termasuk kolom transition_*) ─

export function useAcademicYears() {
  return useQuery<AcademicYear[]>({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("tanggal_mulai", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcademicYear[];
    },
  });
}

// ─── Hook: Status Transisi Aktif (untuk Dashboard Alert) ──────

export function useActiveTransitionStatus(): {
  alertData: TransitionAlertData | null;
  isLoading: boolean;
} {
  const { data: years = [], isLoading } = useAcademicYears();

  // Cari tahun ajaran yang belum selesai transisinya dan mendekati/sudah mulai
  const candidate = years.find((ay) => {
    if (ay.transition_status === "completed") return false;
    const daysUntil = differenceInCalendarDays(
      parseISO(ay.tanggal_mulai),
      new Date()
    );
    return daysUntil <= 30; // Tampilkan mulai H-30
  });

  if (!candidate) return { alertData: null, isLoading };

  const daysUntilStart = differenceInCalendarDays(
    parseISO(candidate.tanggal_mulai),
    new Date()
  );

  return {
    alertData: {
      academic_year: candidate,
      total_students: 0, // diisi oleh komponen via preview
      days_until_start: daysUntilStart,
      is_overdue: daysUntilStart < 0,
    },
    isLoading,
  };
}

// ─── Hook: Preview Kenaikan (RPC get_transition_preview) ──────

export function useTransitionPreview(academicYearId: string | null) {
  return useQuery<TransitionPreview>({
    queryKey: KEYS.preview(academicYearId ?? ""),
    enabled: !!academicYearId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_transition_preview", {
        p_academic_year_id: academicYearId!,
      });
      if (error) throw error;
      return data as unknown as TransitionPreview;
    },
    staleTime: 30_000, // 30 detik — preview cukup stale
  });
}

// ─── Hook: Auto-Suggestion Mapping Kelas ─────────────────────

export function useClassMappingSuggestion(academicYearId: string | null) {
  return useQuery<ClassMapping[]>({
    queryKey: KEYS.suggestion(academicYearId ?? ""),
    enabled: !!academicYearId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_class_mapping_suggestion",
        { p_academic_year_id: academicYearId! }
      );
      if (error) throw error;
      return data as unknown as ClassMapping[];
    },
    staleTime: 60_000,
  });
}

// ─── Hook: Eksekusi Kenaikan (Mutation) ──────────────────────

export function useExecuteTransition() {
  const queryClient = useQueryClient();

  return useMutation<TransitionExecuteResult, Error, TransitionExecuteInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.rpc(
        "execute_academic_year_transition",
        {
          p_academic_year_id: input.academic_year_id,
          p_class_mappings: input.class_mappings as unknown as never,
          p_teacher_action: input.teacher_action,
          p_notes: input.notes ?? null,
        }
      );
      if (error) throw error;
      return data as unknown as TransitionExecuteResult;
    },
    onSuccess: (result) => {
      // Invalidate semua query yang relevan
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: KEYS.history });
      queryClient.invalidateQueries({ queryKey: ["monitoring"] });

      toast({
        title: "✅ Proses Kenaikan Berhasil",
        description: `${result.total_naik} siswa naik kelas, ${result.total_alumni} siswa menjadi Alumni. Durasi: ${(result.duration_ms / 1000).toFixed(1)} detik.`,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Proses Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ─── Hook: Riwayat Transisi ───────────────────────────────────

export function useTransitionHistory(limit = 20, offset = 0) {
  return useQuery<AcademicYearTransition[]>({
    queryKey: [...KEYS.history, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_transition_history", {
        p_limit: limit,
        p_offset: offset,
      });
      if (error) throw error;
      return (data as unknown as AcademicYearTransition[]) ?? [];
    },
  });
}

// ─── Hook: Buat / Update Tahun Ajaran ────────────────────────

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      nama: string;
      tanggal_mulai: string;
      tanggal_selesai: string;
    }) => {
      const { data, error } = await supabase
        .from("academic_years")
        .insert({
          nama: payload.nama,
          tanggal_mulai: payload.tanggal_mulai,
          tanggal_selesai: payload.tanggal_selesai,
          status: "draft",
          transition_status: "waiting",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast({ title: "✅ Tahun Ajaran baru berhasil dibuat" });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal membuat Tahun Ajaran",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
