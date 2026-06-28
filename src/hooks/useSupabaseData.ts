import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { isTeacherRole } from "@/lib/roleLabels";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];

export const LEVELS: ReadingLevel[] = [
  "Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6",
  "Tahsin Lanjutan", "Tahfizh"
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

export const fetchApprovedManagedStudentIds = async (userId?: string, role?: string) => {
  if (!userId || !isTeacherRole(role)) return null;

  const { data, error } = await supabase
    .from("teacher_students")
    .select("student_id")
    .eq("teacher_id", userId)
    .eq("status", "approved");

  if (error) throw error;

  return Array.from(new Set((data ?? []).map((item: { student_id: string }) => item.student_id)));
};

// ─── STUDENTS ────────────────────────────────────────────────────────────────
export const useStudents = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["students", user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("*")
        .order("kelas", { ascending: true })
        .order("nama", { ascending: true });

      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];
      if (managedStudentIds) query = query.in("id", managedStudentIds);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const usePaginatedStudents = ({
  page,
  pageSize,
  search,
  kelas,
  rombel,
  level,
}: {
  page: number;
  pageSize: number;
  search: string;
  kelas: string;
  rombel: string;
  level: string;
}) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["students", "paginated", { page, pageSize, search, kelas, rombel, level, userId: user?.id ?? "anon", role: profile?.role ?? "none" }],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("*", { count: "exact" });

      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) {
        return {
          students: [],
          totalCount: 0,
        };
      }
      if (managedStudentIds) {
        query = query.in("id", managedStudentIds);
      }

      if (search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.or(`nama.ilike.${searchTerm},nis.ilike.${searchTerm},nisn.ilike.${searchTerm},rombel.ilike.${searchTerm}`);
      }

      if (kelas !== "all") {
        query = query.eq("kelas", parseInt(kelas));
      }
      if (rombel !== "all") {
        query = query.eq("rombel", rombel);
      }

      if (level !== "all") {
        if (level === "tahsin-dasar" || level === "Tahsin Dasar") {
          query = query.in("level", IQRO_LEVELS);
        } else if (level === "tahsin-lanjutan" || level === "Tahsin Lanjutan") {
          query = query.eq("level", "Tahsin Lanjutan");
        } else if (level === "tahfizh" || level === "Tahfizh") {
          query = query.eq("level", "Tahfizh");
        } else {
          query = query.eq("level", level as ReadingLevel);
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query
        .order("kelas", { ascending: true })
        .order("nama", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        students: data || [],
        totalCount: count || 0,
      };
    },
  });
};

export const useStudentsByClass = (kelas: number) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["students", "class", kelas, user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("*")
        .eq("kelas", kelas)
        .order("nama", { ascending: true });

      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && managedStudentIds.length === 0) return [];
      if (managedStudentIds) query = query.in("id", managedStudentIds);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useStudent = (id: string) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["student", id, user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && !managedStudentIds.includes(id)) return null;

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
};

export const useAddStudent = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (student: { nama: string; kelas: number; level: ReadingLevel; rombel?: string; nis?: string | null; nisn?: string | null }) => {
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
    mutationFn: async ({ id, ...updates }: { id: string; nama?: string; kelas?: number; level?: ReadingLevel; halaman_terakhir?: number; status_bacaan?: ReadingStatus; rombel?: string; nis?: string | null; nisn?: string | null }) => {
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
export const useProgressEntries = (studentId: string) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["progress", studentId, user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && !managedStudentIds.includes(studentId)) return [];

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
};

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

export const useTahsinAssessments = (studentId: string) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ["tahsin", studentId, user?.id ?? "anon", profile?.role ?? "none"],
    queryFn: async () => {
      const managedStudentIds = await fetchApprovedManagedStudentIds(user?.id, profile?.role);
      if (managedStudentIds && !managedStudentIds.includes(studentId)) return [];

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
};

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
