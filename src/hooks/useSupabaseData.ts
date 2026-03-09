import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];

export const LEVELS: ReadingLevel[] = [
  "Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6",
  "Tahsin Dasar", "Tahsin Lanjutan", "Tahfizh"
];

export const LEVEL_COLORS: Record<ReadingLevel, string> = {
  "Iqro 1": "bg-amber-100 text-amber-700",
  "Iqro 2": "bg-amber-100 text-amber-700",
  "Iqro 3": "bg-amber-100 text-amber-700",
  "Iqro 4": "bg-amber-100 text-amber-700",
  "Iqro 5": "bg-amber-100 text-amber-700",
  "Iqro 6": "bg-amber-100 text-amber-700",
  "Tahsin Dasar": "bg-orange-100 text-orange-700",
  "Tahsin Lanjutan": "bg-emerald-100 text-emerald-700",
  "Tahfizh": "bg-purple-100 text-purple-700",
};

// ─── GROUPING HELPERS ─────────────────────────────────────────────────────────
/** Iqro 1-6 merupakan sub-level dari "Tahsin Dasar" */
export const IQRO_LEVELS: ReadingLevel[] = [
  "Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6",
];

/** Label tampilan untuk setiap level — Iqro ditampilkan dengan grup Tahsin Dasar */
export const getLevelDisplayLabel = (level: ReadingLevel): string => {
  if (IQRO_LEVELS.includes(level)) return `Tahsin Dasar — ${level}`;
  return level;
};

/** Apakah level ini termasuk dalam grup "Tahsin Dasar" (Iqro 1-6) */
export const isTahsinDasar = (level: ReadingLevel): boolean =>
  IQRO_LEVELS.includes(level) || level === "Tahsin Dasar";

/** Grup level untuk statistik/filter: Tahsin Dasar mencakup semua Iqro */
export type LevelGroup = "Tahsin Dasar" | "Tahsin Lanjutan" | "Tahfizh";
export const getLevelGroup = (level: ReadingLevel): LevelGroup | null => {
  if (IQRO_LEVELS.includes(level) || level === "Tahsin Dasar") return "Tahsin Dasar";
  if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
  if (level === "Tahfizh") return "Tahfizh";
  return null;
};

/** Warna khusus per jilid Iqro saat ditampilkan dalam grup */
export const IQRO_JILID_COLORS: Record<string, string> = {
  "Iqro 1": "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  "Iqro 2": "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  "Iqro 3": "bg-lime-50 text-lime-700 ring-1 ring-lime-200",
  "Iqro 4": "bg-green-50 text-green-700 ring-1 ring-green-200",
  "Iqro 5": "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  "Iqro 6": "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
};

export const getNextLevel = (current: ReadingLevel): ReadingLevel | null => {
  const idx = LEVELS.indexOf(current);
  if (idx < LEVELS.length - 1) return LEVELS[idx + 1];
  return null;
};

// ─── STUDENTS ────────────────────────────────────────────────────────────────
export const useStudents = () =>
  useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("kelas", { ascending: true })
        .order("nama", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useStudentsByClass = (kelas: number) =>
  useQuery({
    queryKey: ["students", "class", kelas],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("kelas", kelas)
        .order("nama", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const useStudent = (id: string) =>
  useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

export const useAddStudent = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (student: { nama: string; kelas: number; level: ReadingLevel; rombel?: string }) => {
      const { data, error } = await supabase
        .from("students")
        .insert({ ...student, rombel: student.rombel ?? 'A', created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["students", "class", variables.kelas] });
    },
  });
};

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; level?: ReadingLevel; halaman_terakhir?: number; status_bacaan?: ReadingStatus; rombel?: string }) => {
      const { data, error } = await supabase
        .from("students")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student", data.id] });
      qc.invalidateQueries({ queryKey: ["students", "class", data.kelas] });
    },
  });
};

export const useDeleteStudent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, kelas }: { id: string; kelas: number }) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      return { id, kelas };
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["students", "class", variables.kelas] });
    },
  });
};

// ─── PROGRESS ENTRIES ────────────────────────────────────────────────────────
export const useProgressEntries = (studentId: string) =>
  useQuery({
    queryKey: ["progress", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_entries")
        .select("*")
        .eq("student_id", studentId)
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

export const useAddProgress = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry: {
      student_id: string;
      buku: string;
      halaman: number;
      kelancaran: number;
      makhraj: number;
      tajwid: number;
      catatan?: string;
    }) => {
      const { data, error } = await supabase
        .from("progress_entries")
        .insert({ ...entry, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["progress", data.student_id] });
    },
  });
};

// ─── EXAM RECORDS ─────────────────────────────────────────────────────────────
export const useExamRecords = (studentId: string) =>
  useQuery({
    queryKey: ["exams", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_records")
        .select("*")
        .eq("student_id", studentId)
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

export const useAllExamRecords = () =>
  useQuery({
    queryKey: ["exams", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_records")
        .select("*, students(nama, kelas)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useAddExam = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (exam: Database["public"]["Tables"]["exam_records"]["Insert"]) => {
      const { data, error } = await supabase
        .from("exam_records")
        .insert({ ...exam, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["exams", data.student_id] });
      qc.invalidateQueries({ queryKey: ["exams", "all"] });
    },
  });
};

// ─── TAHSIN ASSESSMENTS ───────────────────────────────────────────────────────
export interface TahsinAssessment {
  id: string;
  student_id: string;
  created_by: string | null;
  tanggal: string;
  makhraj_huruf: number;
  hukum_nun_mati: number;
  hukum_mim_mati: number;
  mad: number;
  tartil: number;
  nilai_total: number;
  predikat: string;
  keterangan: Record<string, string>;
  catatan: string;
  level_dinilai: string;
  created_at: string;
  updated_at: string;
}

export const useTahsinAssessments = (studentId: string) =>
  useQuery({
    queryKey: ["tahsin", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tahsin_assessments" as never)
        .select("*")
        .eq("student_id", studentId)
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return data as TahsinAssessment[];
    },
    enabled: !!studentId,
  });

export const useAddTahsinAssessment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (assessment: {
      student_id: string;
      level_dinilai: string;
      makhraj_huruf: number;
      hukum_nun_mati: number;
      hukum_mim_mati: number;
      mad: number;
      tartil: number;
      nilai_total: number;
      predikat: string;
      keterangan: Record<string, string>;
      catatan: string;
    }) => {
      const { data, error } = await supabase
        .from("tahsin_assessments" as never)
        .insert({ ...assessment, created_by: user?.id ?? null } as never)
        .select()
        .single();
      if (error) throw error;
      return data as TahsinAssessment;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tahsin", data.student_id] });
    },
  });
};
